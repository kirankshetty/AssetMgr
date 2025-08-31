import requests
import sys
import json
from datetime import datetime

class AssetInventoryAPITester:
    def __init__(self, base_url="https://inventree-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}  # Store tokens for different users
        self.users = {}   # Store user data
        self.test_data = {}  # Store created test data
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, user_role=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add auth header if user role specified
        if user_role and user_role in self.tokens:
            headers['Authorization'] = f'Bearer {self.tokens[user_role]}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, email, password, role_name):
        """Test login and store token"""
        print(f"\n🔐 Testing login for {role_name} ({email})")
        success, response = self.run_test(
            f"Login {role_name}",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'session_token' in response:
            self.tokens[role_name] = response['session_token']
            self.users[role_name] = response['user']
            print(f"✅ {role_name} login successful, token stored")
            return True
        print(f"❌ {role_name} login failed")
        return False

    def test_auth_me(self, role_name):
        """Test /auth/me endpoint"""
        success, response = self.run_test(
            f"Get current user info ({role_name})",
            "GET",
            "auth/me",
            200,
            user_role=role_name
        )
        return success

    def test_dashboard_stats(self, role_name):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            f"Get dashboard stats ({role_name})",
            "GET",
            "dashboard/stats",
            200,
            user_role=role_name
        )
        if success:
            print(f"   Stats received: {list(response.keys())}")
        return success

    def test_asset_type_crud(self):
        """Test Asset Type CRUD operations"""
        print(f"\n📋 Testing Asset Type CRUD Operations")
        
        # Test Create (Admin)
        asset_type_data = {
            "code": "LAPTOP",
            "name": "Laptop Computers",
            "depreciation_applicable": True,
            "asset_life": 3,
            "to_be_recovered_on_separation": True,
            "status": "Active"
        }
        
        success, response = self.run_test(
            "Create Asset Type",
            "POST",
            "asset-types",
            200,
            data=asset_type_data,
            user_role="Administrator"
        )
        
        if success:
            self.test_data['asset_type_id'] = response['id']
            print(f"   Created asset type with ID: {response['id']}")
        
        # Test Get All Asset Types
        success, response = self.run_test(
            "Get All Asset Types",
            "GET",
            "asset-types",
            200,
            user_role="Administrator"
        )
        
        if success:
            print(f"   Found {len(response)} asset types")
        
        # Test Get Single Asset Type
        if 'asset_type_id' in self.test_data:
            success, response = self.run_test(
                "Get Single Asset Type",
                "GET",
                f"asset-types/{self.test_data['asset_type_id']}",
                200,
                user_role="Administrator"
            )
        
        # Test Update Asset Type
        if 'asset_type_id' in self.test_data:
            update_data = {"name": "Updated Laptop Computers"}
            success, response = self.run_test(
                "Update Asset Type",
                "PUT",
                f"asset-types/{self.test_data['asset_type_id']}",
                200,
                data=update_data,
                user_role="Administrator"
            )

    def test_asset_definition_crud(self):
        """Test Asset Definition CRUD operations"""
        print(f"\n💻 Testing Asset Definition CRUD Operations")
        
        if 'asset_type_id' not in self.test_data:
            print("❌ Skipping Asset Definition tests - no asset type created")
            return
        
        # Test Create Asset Definition
        asset_def_data = {
            "asset_type_id": self.test_data['asset_type_id'],
            "asset_code": "LAP001",
            "asset_description": "Dell Laptop",
            "asset_details": "Dell Inspiron 15 3000 Series",
            "asset_value": 50000.0,
            "asset_depreciation_value_per_year": 16666.67,
            "status": "Available"
        }
        
        success, response = self.run_test(
            "Create Asset Definition",
            "POST",
            "asset-definitions",
            200,
            data=asset_def_data,
            user_role="Administrator"
        )
        
        if success:
            self.test_data['asset_def_id'] = response['id']
            print(f"   Created asset definition with ID: {response['id']}")
        
        # Test Get All Asset Definitions
        success, response = self.run_test(
            "Get All Asset Definitions",
            "GET",
            "asset-definitions",
            200,
            user_role="Administrator"
        )
        
        if success:
            print(f"   Found {len(response)} asset definitions")

    def test_asset_requisition_workflow(self):
        """Test Asset Requisition workflow"""
        print(f"\n📝 Testing Asset Requisition Workflow")
        
        if 'asset_type_id' not in self.test_data:
            print("❌ Skipping Requisition tests - no asset type created")
            return
        
        # Employee creates requisition
        requisition_data = {
            "asset_type_id": self.test_data['asset_type_id'],
            "justification": "Need laptop for development work"
        }
        
        success, response = self.run_test(
            "Create Asset Requisition (Employee)",
            "POST",
            "asset-requisitions",
            200,
            data=requisition_data,
            user_role="Employee"
        )
        
        if success:
            self.test_data['requisition_id'] = response['id']
            print(f"   Created requisition with ID: {response['id']}")
        
        # Test Get Requisitions for different roles
        for role in ["Employee", "Manager", "HR Manager", "Administrator"]:
            if role in self.tokens:
                success, response = self.run_test(
                    f"Get Asset Requisitions ({role})",
                    "GET",
                    "asset-requisitions",
                    200,
                    user_role=role
                )
                if success:
                    print(f"   {role} can see {len(response)} requisitions")

    def test_role_based_access(self):
        """Test role-based access control"""
        print(f"\n🔒 Testing Role-Based Access Control")
        
        # Test Employee trying to create asset type (should fail)
        asset_type_data = {
            "code": "TEST",
            "name": "Test Asset",
            "depreciation_applicable": False
        }
        
        success, response = self.run_test(
            "Employee Create Asset Type (Should Fail)",
            "POST",
            "asset-types",
            403,  # Expecting forbidden
            data=asset_type_data,
            user_role="Employee"
        )
        
        if success:
            print("   ✅ Employee correctly denied access to create asset type")
        
        # Test Manager trying to create asset type (should fail)
        success, response = self.run_test(
            "Manager Create Asset Type (Should Fail)",
            "POST",
            "asset-types",
            403,  # Expecting forbidden
            data=asset_type_data,
            user_role="Manager"
        )
        
        if success:
            print("   ✅ Manager correctly denied access to create asset type")

    def test_validation_rules(self):
        """Test business validation rules"""
        print(f"\n✅ Testing Validation Rules")
        
        # Test asset type with depreciation but no asset life
        invalid_asset_type = {
            "code": "INVALID",
            "name": "Invalid Asset",
            "depreciation_applicable": True,
            # Missing asset_life
        }
        
        success, response = self.run_test(
            "Create Asset Type Without Asset Life (Should Fail)",
            "POST",
            "asset-types",
            400,  # Expecting bad request
            data=invalid_asset_type,
            user_role="Administrator"
        )
        
        if success:
            print("   ✅ Validation correctly rejected asset type without asset life")
        
        # Test duplicate asset type code
        if 'asset_type_id' in self.test_data:
            duplicate_asset_type = {
                "code": "LAPTOP",  # Same as existing
                "name": "Duplicate Laptop",
                "depreciation_applicable": False
            }
            
            success, response = self.run_test(
                "Create Duplicate Asset Type Code (Should Fail)",
                "POST",
                "asset-types",
                400,  # Expecting bad request
                data=duplicate_asset_type,
                user_role="Administrator"
            )
            
            if success:
                print("   ✅ Validation correctly rejected duplicate asset type code")

    def test_user_management(self):
        """Test User Management CRUD operations (Administrator only)"""
        print(f"\n👥 Testing User Management Operations")
        
        # Test Create User (Administrator only)
        user_data = {
            "email": f"testuser_{datetime.now().strftime('%H%M%S')}@company.com",
            "name": "Test User",
            "role": "Employee",
            "password": "TestPassword123!"
        }
        
        success, response = self.run_test(
            "Create User (Administrator)",
            "POST",
            "users",
            200,
            data=user_data,
            user_role="Administrator"
        )
        
        if success:
            self.test_data['created_user_id'] = response['id']
            print(f"   Created user with ID: {response['id']}")
        
        # Test Get All Users (Administrator only)
        success, response = self.run_test(
            "Get All Users (Administrator)",
            "GET",
            "users",
            200,
            user_role="Administrator"
        )
        
        if success:
            print(f"   Found {len(response)} users")
        
        # Test Get Single User (Administrator only)
        if 'created_user_id' in self.test_data:
            success, response = self.run_test(
                "Get Single User (Administrator)",
                "GET",
                f"users/{self.test_data['created_user_id']}",
                200,
                user_role="Administrator"
            )
        
        # Test Update User (Administrator only)
        if 'created_user_id' in self.test_data:
            update_data = {"name": "Updated Test User", "role": "Manager"}
            success, response = self.run_test(
                "Update User (Administrator)",
                "PUT",
                f"users/{self.test_data['created_user_id']}",
                200,
                data=update_data,
                user_role="Administrator"
            )
        
        # Test Employee trying to access user management (should fail)
        success, response = self.run_test(
            "Employee Get Users (Should Fail)",
            "GET",
            "users",
            403,  # Expecting forbidden
            user_role="Employee"
        )
        
        if success:
            print("   ✅ Employee correctly denied access to user management")

    def test_company_profile(self):
        """Test Company Profile operations (Administrator only)"""
        print(f"\n🏢 Testing Company Profile Operations")
        
        # Test Get Company Profile (public endpoint)
        success, response = self.run_test(
            "Get Company Profile (Public)",
            "GET",
            "company-profile",
            200
        )
        
        if success:
            print(f"   Retrieved company profile: {response.get('company_name', 'Default')}")
        
        # Test Create/Update Company Profile (Administrator only)
        profile_data = {
            "company_name": "Test Company Inc.",
            "company_address": "123 Test Street, Test City",
            "company_phone": "+1-555-0123",
            "company_email": "info@testcompany.com",
            "company_website": "https://testcompany.com"
        }
        
        success, response = self.run_test(
            "Create/Update Company Profile (Administrator)",
            "POST",
            "company-profile",
            200,
            data=profile_data,
            user_role="Administrator"
        )
        
        if success:
            print(f"   Created/Updated company profile with ID: {response['id']}")
        
        # Test Update Company Profile (Administrator only)
        update_data = {"company_name": "Updated Test Company Inc."}
        success, response = self.run_test(
            "Update Company Profile (Administrator)",
            "PUT",
            "company-profile",
            200,
            data=update_data,
            user_role="Administrator"
        )
        
        # Test Employee trying to update company profile (should fail)
        success, response = self.run_test(
            "Employee Update Company Profile (Should Fail)",
            "POST",
            "company-profile",
            403,  # Expecting forbidden
            data=profile_data,
            user_role="Employee"
        )
        
        if success:
            print("   ✅ Employee correctly denied access to company profile management")

    def test_password_change(self):
        """Test Password Change functionality (All authenticated users)"""
        print(f"\n🔑 Testing Password Change Operations")
        
        # Test password change for Administrator
        password_data = {
            "current_password": "password123",
            "new_password": "NewPassword123!"
        }
        
        success, response = self.run_test(
            "Change Password (Administrator)",
            "POST",
            "auth/change-password",
            200,
            data=password_data,
            user_role="Administrator"
        )
        
        if success:
            print("   ✅ Administrator password change successful")
        
        # Test password change with wrong current password (should fail)
        wrong_password_data = {
            "current_password": "wrongpassword",
            "new_password": "NewPassword123!"
        }
        
        success, response = self.run_test(
            "Change Password Wrong Current (Should Fail)",
            "POST",
            "auth/change-password",
            400,  # Expecting bad request
            data=wrong_password_data,
            user_role="Employee"
        )
        
        if success:
            print("   ✅ Wrong current password correctly rejected")

    def test_bulk_import_template(self):
        """Test Bulk Import Template Download (Administrator/HR Manager only)"""
        print(f"\n📥 Testing Bulk Import Template Operations")
        
        # Test template download (Administrator)
        success, response = self.run_test(
            "Download Asset Definitions Template (Administrator)",
            "GET",
            "asset-definitions/template",
            200,
            user_role="Administrator"
        )
        
        if success:
            print("   ✅ Template download successful for Administrator")
        
        # Test template download (HR Manager)
        if "HR Manager" in self.tokens:
            success, response = self.run_test(
                "Download Asset Definitions Template (HR Manager)",
                "GET",
                "asset-definitions/template",
                200,
                user_role="HR Manager"
            )
            
            if success:
                print("   ✅ Template download successful for HR Manager")
        
        # Test Employee trying to download template (should fail)
        success, response = self.run_test(
            "Employee Download Template (Should Fail)",
            "GET",
            "asset-definitions/template",
            403,  # Expecting forbidden
            user_role="Employee"
        )
        
        if success:
            print("   ✅ Employee correctly denied access to template download")

    def test_new_admin_features_access_control(self):
        """Test access control for all new administrator features"""
        print(f"\n🔐 Testing New Admin Features Access Control")
        
        # Test various roles trying to access admin-only endpoints
        test_cases = [
            ("users", "GET", "Employee", 403),
            ("users", "GET", "Manager", 403),
            ("users", "GET", "HR Manager", 403),
            ("company-profile", "POST", "Employee", 403),
            ("company-profile", "POST", "Manager", 403),
            ("company-profile", "POST", "HR Manager", 403),
            ("asset-definitions/template", "GET", "Employee", 403),
            ("asset-definitions/template", "GET", "Manager", 403),
        ]
        
        for endpoint, method, role, expected_status in test_cases:
            if role in self.tokens:
                success, response = self.run_test(
                    f"{role} access {endpoint} (Should Fail)",
                    method,
                    endpoint,
                    expected_status,
                    user_role=role
                )
                
                if success:
                    print(f"   ✅ {role} correctly denied access to {endpoint}")

def main():
    print("🚀 Starting Asset Inventory Management System API Tests")
    print("=" * 60)
    
    tester = AssetInventoryAPITester()
    
    # Test user credentials
    test_users = [
        ("admin@company.com", "password123", "Administrator"),
        ("hr@company.com", "password123", "HR Manager"),
        ("manager@company.com", "password123", "Manager"),
        ("employee@company.com", "password123", "Employee")
    ]
    
    # Test authentication for all users
    print("\n🔐 AUTHENTICATION TESTS")
    print("-" * 30)
    login_success = True
    for email, password, role in test_users:
        if not tester.test_login(email, password, role):
            login_success = False
    
    if not any(role in tester.tokens for role in ["HR Manager", "Administrator"]):
        print("\n❌ No admin-level users logged in. Cannot proceed with CRUD tests.")
        return 1
    
    # Test /auth/me for all users
    for role in ["Administrator", "HR Manager", "Manager", "Employee"]:
        if role in tester.tokens:
            tester.test_auth_me(role)
    
    # Test dashboard stats for all users
    print("\n📊 DASHBOARD TESTS")
    print("-" * 20)
    for role in ["Administrator", "HR Manager", "Manager", "Employee"]:
        if role in tester.tokens:
            tester.test_dashboard_stats(role)
    
    # Test CRUD operations
    print("\n🔧 CRUD OPERATIONS TESTS")
    print("-" * 25)
    tester.test_asset_type_crud()
    tester.test_asset_definition_crud()
    tester.test_asset_requisition_workflow()
    
    # Test access control
    tester.test_role_based_access()
    
    # Test validation rules
    tester.test_validation_rules()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())