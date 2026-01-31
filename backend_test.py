#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class VoiceAgentAPITester:
    def __init__(self, base_url="https://calendar-voice-3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tenant_id = None
        self.user_id = None
        self.test_email = None
        self.test_password = "TestPass123!"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, use_admin_token=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Choose token based on test type
        token_to_use = self.admin_token if use_admin_token else self.token
        if token_to_use:
            headers['Authorization'] = f'Bearer {token_to_use}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_result(name, True)
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_result(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_register_tenant(self):
        """Test tenant registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_email = f"test{timestamp}@example.com"
        
        test_data = {
            "company_name": f"Test Company {timestamp}",
            "contact_person": f"Test Person {timestamp}",
            "email": self.test_email,
            "password": self.test_password,
            "phone": "+49 30 12345678",
            "street": "Teststraße",
            "house_number": "123",
            "postal_code": "12345",
            "city": "Berlin",
            "country": "Deutschland",
            "tax_number": "123/456/78901",
            "vat_id": "DE123456789"
        }
        
        success, response = self.run_test(
            "Register Tenant",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'tenant_id' in response:
            self.tenant_id = response['tenant_id']
            print(f"   Tenant registered: {self.tenant_id}")
            return True
        return False

    def test_login(self):
        """Test login with registered tenant"""
        # Use the tenant that was already registered in test_register_tenant
        if not self.tenant_id or not self.test_email:
            self.log_result("Login Regular User", False, "No tenant registered")
            return False
            
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        success, response = self.run_test(
            "Login Regular User",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user_id']
            print(f"   Token obtained: {self.token[:20]}...")
            print(f"   Tenant status: {response.get('tenant_status', 'unknown')}")
            return True
        return False

    def test_super_admin_login(self):
        """Test Super Admin login"""
        login_data = {
            "email": "admin@voiceagent.de",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Super Admin Login",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            print(f"   Is super admin: {response.get('is_super_admin', False)}")
            return True
        return False

    def test_get_current_user(self):
        """Test get current user info"""
        if not self.token:
            self.log_result("Get Current User", False, "No token available")
            return False
            
        return self.run_test("Get Current User", "GET", "auth/me", 200)[0]

    def test_get_stats(self):
        """Test dashboard stats"""
        if not self.token:
            self.log_result("Get Stats", False, "No token available")
            return False
            
        return self.run_test("Get Dashboard Stats", "GET", "stats", 200)[0]

    def test_tenant_operations(self):
        """Test tenant operations"""
        if not self.token:
            self.log_result("Tenant Operations", False, "No token available")
            return False
            
        # Get tenant info
        success1, _ = self.run_test("Get Tenant Info", "GET", "tenant", 200)
        
        # Note: There's no PUT endpoint for updating tenant info in the current API
        # This is expected behavior - tenant info is managed through admin panel
        
        return success1

    def test_approved_tenant_operations(self):
        """Test operations after tenant approval"""
        if not self.token or not self.admin_token or not self.tenant_id:
            self.log_result("Approved Tenant Operations", False, "Missing tokens or tenant ID")
            return False
            
        # First approve the tenant using admin token
        success_approve, _ = self.run_test(
            "Approve Current Tenant", 
            "POST", 
            f"admin/tenants/{self.tenant_id}/approve", 
            200,
            use_admin_token=True
        )
        
        if not success_approve:
            return False
        
        # Now test tenant operations that require approval
        success1, _ = self.run_test("Get Users (Approved)", "GET", "users", 200)
        
        # Create new user (should work since we have max 2 users)
        user_data = {
            "email": f"user2_{datetime.now().strftime('%H%M%S')}@example.com",
            "username": f"User Two {datetime.now().strftime('%H%M%S')}",
            "password": "UserPass123!"
        }
        
        success2, response = self.run_test(
            "Create User (Approved)",
            "POST",
            "users",
            200,
            data=user_data
        )
        
        new_user_id = None
        if success2 and 'id' in response:
            new_user_id = response['id']
        
        # Test calendar operations
        success3, _ = self.run_test("Get Calendars (Approved)", "GET", "calendars", 200)
        
        # Test appointments
        success4, _ = self.run_test("Get Appointments (Approved)", "GET", "appointments", 200)
        
        # Test voice operations
        voice_data = {
            "transcription": "Was sind meine Termine heute?"
        }
        success5, _ = self.run_test(
            "Process Voice Input (Approved)",
            "POST",
            "voice/process",
            200,
            data=voice_data
        )
        
        # Test conversation history
        success6, _ = self.run_test("Get Conversations (Approved)", "GET", "conversations", 200)
        
        # Clean up - delete the created user
        success7 = True
        if new_user_id:
            success7, _ = self.run_test(
                "Delete Created User",
                "DELETE",
                f"users/{new_user_id}",
                200
            )
        
        return success1 and success2 and success3 and success4 and success5 and success6 and success7

    def test_user_management(self):
        """Test user management operations (for pending tenant - should fail)"""
        if not self.token:
            self.log_result("User Management", False, "No token available")
            return False
            
        # These should fail because tenant is pending
        success1, _ = self.run_test("Get Users (Pending)", "GET", "users", 403)
        success2, _ = self.run_test("Create User (Pending)", "POST", "users", 403, data={
            "email": "test@example.com",
            "username": "Test User",
            "password": "TestPass123!"
        })
        
        return success1 and success2

    def test_calendar_operations(self):
        """Test calendar operations"""
        if not self.token:
            self.log_result("Calendar Operations", False, "No token available")
            return False
            
        # Get calendars (should be empty initially)
        success1, _ = self.run_test("Get Calendars", "GET", "calendars", 200)
        
        # Add calendar connection
        calendar_data = {
            "provider": "google",
            "email": "test@gmail.com",
            "access_token": "fake_access_token_for_testing",
            "refresh_token": "fake_refresh_token",
            "expires_at": (datetime.now() + timedelta(hours=1)).isoformat()
        }
        
        success2, response = self.run_test(
            "Add Calendar Connection",
            "POST",
            "calendars",
            200,
            data=calendar_data
        )
        
        calendar_id = None
        if success2 and 'id' in response:
            calendar_id = response['id']
        
        # Delete calendar connection
        success3 = True
        if calendar_id:
            success3, _ = self.run_test(
                "Delete Calendar Connection",
                "DELETE",
                f"calendars/{calendar_id}",
                200
            )
        
        return success1 and success2 and success3

    def test_appointment_operations(self):
        """Test appointment operations"""
        if not self.token:
            self.log_result("Appointment Operations", False, "No token available")
            return False
            
        # Get appointments (should be empty initially)
        success1, _ = self.run_test("Get Appointments", "GET", "appointments", 200)
        
        # Create appointment
        appointment_data = {
            "title": "Test Meeting",
            "description": "Test appointment description",
            "start_time": (datetime.now() + timedelta(hours=1)).isoformat(),
            "end_time": (datetime.now() + timedelta(hours=2)).isoformat(),
            "calendar_provider": "local"
        }
        
        success2, response = self.run_test(
            "Create Appointment",
            "POST",
            "appointments",
            200,
            data=appointment_data
        )
        
        appointment_id = None
        if success2 and 'id' in response:
            appointment_id = response['id']
        
        # Delete appointment
        success3 = True
        if appointment_id:
            success3, _ = self.run_test(
                "Delete Appointment",
                "DELETE",
                f"appointments/{appointment_id}",
                200
            )
        
        return success1 and success2 and success3

    def test_voice_operations(self):
        """Test voice operations (without actual audio)"""
        if not self.token:
            self.log_result("Voice Operations", False, "No token available")
            return False
            
        # Test voice processing with text input
        voice_data = {
            "transcription": "Was sind meine Termine heute?"
        }
        
        success1, _ = self.run_test(
            "Process Voice Input",
            "POST",
            "voice/process",
            200,
            data=voice_data
        )
        
        return success1

    def test_admin_operations(self):
        """Test Super Admin operations"""
        if not self.admin_token:
            self.log_result("Admin Operations", False, "No admin token available")
            return False
            
        # Get admin stats
        success1, _ = self.run_test("Get Admin Stats", "GET", "admin/stats", 200, use_admin_token=True)
        
        # Get all tenants
        success2, tenants_response = self.run_test("Get All Tenants", "GET", "admin/tenants", 200, use_admin_token=True)
        
        # Get pending tenants
        success3, _ = self.run_test("Get Pending Tenants", "GET", "admin/tenants?status=pending", 200, use_admin_token=True)
        
        # Get pricing plans
        success4, _ = self.run_test("Get Pricing Plans", "GET", "admin/pricing-plans", 200, use_admin_token=True)
        
        # Get minute packages
        success5, _ = self.run_test("Get Minute Packages", "GET", "admin/minute-packages", 200, use_admin_token=True)
        
        # Test tenant approval if we have a pending tenant
        if success2 and tenants_response and len(tenants_response) > 0:
            # Find a pending tenant
            pending_tenant = None
            for tenant in tenants_response:
                if tenant.get('status') == 'pending':
                    pending_tenant = tenant
                    break
            
            if pending_tenant:
                # Approve the tenant
                success6, _ = self.run_test(
                    "Approve Tenant", 
                    "POST", 
                    f"admin/tenants/{pending_tenant['id']}/approve", 
                    200, 
                    use_admin_token=True
                )
                return success1 and success2 and success3 and success4 and success5 and success6
        
        return success1 and success2 and success3 and success4 and success5

    def test_pricing_management(self):
        """Test pricing plan management"""
        if not self.admin_token:
            self.log_result("Pricing Management", False, "No admin token available")
            return False
            
        # Create a new pricing plan
        plan_data = {
            "name": f"Test Plan {datetime.now().strftime('%H%M%S')}",
            "price_per_minute": 0.20,
            "monthly_fee": 50.0,
            "included_minutes": 200,
            "description": "Test pricing plan",
            "is_active": True
        }
        
        success1, response = self.run_test(
            "Create Pricing Plan",
            "POST",
            "admin/pricing-plans",
            200,
            data=plan_data,
            use_admin_token=True
        )
        
        plan_id = None
        if success1 and 'id' in response:
            plan_id = response['id']
        
        # Update the plan
        success2 = True
        if plan_id:
            updated_plan_data = {
                **plan_data,
                "price_per_minute": 0.25
            }
            success2, _ = self.run_test(
                "Update Pricing Plan",
                "PUT",
                f"admin/pricing-plans/{plan_id}",
                200,
                data=updated_plan_data,
                use_admin_token=True
            )
        
        # Delete the plan
        success3 = True
        if plan_id:
            success3, _ = self.run_test(
                "Delete Pricing Plan",
                "DELETE",
                f"admin/pricing-plans/{plan_id}",
                200,
                use_admin_token=True
            )
        
        return success1 and success2 and success3
    def test_conversation_history(self):
        """Test conversation history"""
        if not self.token:
            self.log_result("Conversation History", False, "No token available")
            return False
            
        return self.run_test("Get Conversations", "GET", "conversations", 200)[0]

    def test_tenant_usage_and_invoicing(self):
        """Test tenant usage tracking and invoice generation"""
        if not self.admin_token:
            self.log_result("Usage and Invoicing", False, "No admin token available")
            return False
            
        # Get all invoices
        success1, _ = self.run_test("Get All Invoices", "GET", "admin/invoices", 200, use_admin_token=True)
        
        # Get telephony config
        success2, _ = self.run_test("Get Telephony Config", "GET", "admin/telephony-config", 200, use_admin_token=True)
        
        return success1 and success2

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Voice Agent API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Root Endpoint", self.test_root_endpoint),
            ("Tenant Registration", self.test_register_tenant),
            ("Regular User Login", self.test_login),
            ("Super Admin Login", self.test_super_admin_login),
            ("Current User Info", self.test_get_current_user),
            ("Dashboard Stats", self.test_get_stats),
            ("Tenant Operations", self.test_tenant_operations),
            ("User Management", self.test_user_management),
            ("Calendar Operations", self.test_calendar_operations),
            ("Appointment Operations", self.test_appointment_operations),
            ("Voice Operations", self.test_voice_operations),
            ("Conversation History", self.test_conversation_history),
            ("Admin Operations", self.test_admin_operations),
            ("Pricing Management", self.test_pricing_management),
            ("Usage and Invoicing", self.test_tenant_usage_and_invoicing),
        ]
        
        for test_name, test_func in tests:
            try:
                test_func()
            except Exception as e:
                self.log_result(test_name, False, f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = VoiceAgentAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())