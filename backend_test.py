#!/usr/bin/env python3
"""
Indian Profiles Backend API Testing
Tests all CRUD operations and authentication flows
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class IndianProfilesAPITester:
    def __init__(self, base_url="https://indian-profiles-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test data storage
        self.test_state_id = None
        self.test_district_id = None
        self.test_constituency_id = None
        self.test_sub_region_id = None
        self.test_leader_id = None
        self.test_article_id = None
        self.test_grievance_id = None
        self.test_volunteer_id = None
        self.test_event_id = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200, use_auth: bool = False) -> tuple[bool, Dict]:
        """Make API request with error handling"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if use_auth and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, data = self.make_request('GET', '/')
        self.log_test("Root API Endpoint", success, 
                     f"Response: {data.get('message', 'No message')}" if success else f"Error: {data}")

    def test_admin_login(self):
        """Test admin login functionality"""
        login_data = {
            "email": "admin@indianprofiles.com",
            "password": "Admin@123"
        }
        
        success, data = self.make_request('POST', '/auth/login', login_data)
        
        if success and 'id' in data:
            # Check if cookies are set by making an authenticated request
            me_success, me_data = self.make_request('GET', '/auth/me')
            if me_success:
                self.log_test("Admin Login", True, f"Logged in as: {me_data.get('name', 'Unknown')}")
                return True
            else:
                self.log_test("Admin Login", False, "Login succeeded but /auth/me failed")
                return False
        else:
            self.log_test("Admin Login", False, f"Login failed: {data}")
            return False

    def test_auth_me(self):
        """Test current user endpoint"""
        success, data = self.make_request('GET', '/auth/me')
        self.log_test("Auth Me Endpoint", success,
                     f"User: {data.get('name', 'Unknown')} ({data.get('role', 'Unknown')})" if success else f"Error: {data}")

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        success, data = self.make_request('GET', '/stats')
        if success:
            stats_info = f"States: {data.get('states', 0)}, Districts: {data.get('districts', 0)}, Constituencies: {data.get('constituencies', 0)}, Leaders: {data.get('leaders', 0)}"
            self.log_test("Stats Endpoint", True, stats_info)
        else:
            self.log_test("Stats Endpoint", False, f"Error: {data}")

    def test_state_crud(self):
        """Test state CRUD operations"""
        # Create state
        state_data = {
            "name": "Test State",
            "code": "TS",
            "description": "Test state for API testing"
        }
        
        success, data = self.make_request('POST', '/states', state_data)
        if success and 'id' in data:
            self.test_state_id = data['id']
            self.log_test("Create State", True, f"Created state: {data['name']}")
        else:
            self.log_test("Create State", False, f"Error: {data}")
            return
        
        # Get state
        success, data = self.make_request('GET', f'/states/{self.test_state_id}')
        self.log_test("Get State", success,
                     f"Retrieved: {data.get('name', 'Unknown')}" if success else f"Error: {data}")
        
        # List states
        success, data = self.make_request('GET', '/states')
        self.log_test("List States", success,
                     f"Found {len(data)} states" if success else f"Error: {data}")

    def test_district_crud(self):
        """Test district CRUD operations"""
        if not self.test_state_id:
            self.log_test("Create District", False, "No test state available")
            return
        
        # Create district
        district_data = {
            "name": "Test District",
            "parent_state_id": self.test_state_id,
            "description": "Test district for API testing"
        }
        
        success, data = self.make_request('POST', '/districts', district_data)
        if success and 'id' in data:
            self.test_district_id = data['id']
            self.log_test("Create District", True, f"Created district: {data['name']}")
        else:
            self.log_test("Create District", False, f"Error: {data}")
            return
        
        # Get district
        success, data = self.make_request('GET', f'/districts/{self.test_district_id}')
        self.log_test("Get District", success,
                     f"Retrieved: {data.get('name', 'Unknown')}" if success else f"Error: {data}")
        
        # List districts
        success, data = self.make_request('GET', '/districts')
        self.log_test("List Districts", success,
                     f"Found {len(data)} districts" if success else f"Error: {data}")

    def test_constituency_crud(self):
        """Test constituency CRUD operations"""
        # Create constituency
        constituency_data = {
            "name": "Test Constituency",
            "type": "Assembly",
            "parent_district_id": self.test_district_id,
            "description": "Test constituency for API testing",
            "image_url": "https://example.com/test.jpg"
        }
        
        success, data = self.make_request('POST', '/constituencies', constituency_data)
        if success and 'id' in data:
            self.test_constituency_id = data['id']
            self.log_test("Create Constituency", True, f"Created constituency: {data['name']}")
        else:
            self.log_test("Create Constituency", False, f"Error: {data}")
            return
        
        # Get constituency
        success, data = self.make_request('GET', f'/constituencies/{self.test_constituency_id}')
        self.log_test("Get Constituency", success,
                     f"Retrieved: {data.get('name', 'Unknown')}" if success else f"Error: {data}")
        
        # Update constituency
        update_data = {
            "name": "Updated Test Constituency",
            "type": "Assembly",
            "description": "Updated description"
        }
        success, data = self.make_request('PUT', f'/constituencies/{self.test_constituency_id}', update_data)
        self.log_test("Update Constituency", success,
                     f"Updated to: {data.get('name', 'Unknown')}" if success else f"Error: {data}")
        
        # List constituencies
        success, data = self.make_request('GET', '/constituencies')
        self.log_test("List Constituencies", success,
                     f"Found {len(data)} constituencies" if success else f"Error: {data}")

    def test_sub_region_crud(self):
        """Test sub-region CRUD operations"""
        if not self.test_constituency_id:
            self.log_test("Create Sub-Region", False, "No test constituency available")
            return
        
        # Create sub-region
        sub_region_data = {
            "name": "Test Division",
            "type": "Division",
            "parent_constituency_id": self.test_constituency_id,
            "description": "Test division for API testing"
        }
        
        success, data = self.make_request('POST', '/sub-regions', sub_region_data)
        if success and 'id' in data:
            self.test_sub_region_id = data['id']
            self.log_test("Create Sub-Region", True, f"Created sub-region: {data['name']}")
        else:
            self.log_test("Create Sub-Region", False, f"Error: {data}")
            return
        
        # Get sub-region
        success, data = self.make_request('GET', f'/sub-regions/{self.test_sub_region_id}')
        self.log_test("Get Sub-Region", success,
                     f"Retrieved: {data.get('name', 'Unknown')}" if success else f"Error: {data}")
        
        # List sub-regions
        success, data = self.make_request('GET', '/sub-regions')
        self.log_test("List Sub-Regions", success,
                     f"Found {len(data)} sub-regions" if success else f"Error: {data}")

    def test_leader_crud(self):
        """Test leader CRUD operations"""
        # Create leader
        leader_data = {
            "name": "Test Leader",
            "designation": "MLA",
            "level": "Constituency",
            "constituency_id": self.test_constituency_id,
            "bio_summary": "Test leader for API testing",
            "biography": "Detailed biography of test leader",
            "phone": "+91-9876543210",
            "email": "testleader@example.com",
            "career_timeline": [
                {"year": "2020", "role": "MLA", "description": "Elected as MLA"}
            ]
        }
        
        success, data = self.make_request('POST', '/leaders', leader_data)
        if success and 'id' in data:
            self.test_leader_id = data['id']
            self.log_test("Create Leader", True, f"Created leader: {data['name']}")
        else:
            self.log_test("Create Leader", False, f"Error: {data}")
            return
        
        # Get leader
        success, data = self.make_request('GET', f'/leaders/{self.test_leader_id}')
        self.log_test("Get Leader", success,
                     f"Retrieved: {data.get('name', 'Unknown')}" if success else f"Error: {data}")
        
        # List leaders
        success, data = self.make_request('GET', '/leaders')
        self.log_test("List Leaders", success,
                     f"Found {len(data)} leaders" if success else f"Error: {data}")

    def test_article_crud(self):
        """Test article CRUD operations"""
        # Create article
        article_data = {
            "title": "Test Development Work",
            "content": "This is a test article about development work in the constituency.",
            "event_date": "2024-01-15",
            "featured_image": "https://example.com/article.jpg",
            "constituency_id": self.test_constituency_id,
            "tagged_leader_ids": [self.test_leader_id] if self.test_leader_id else [],
            "article_type": "development",
            "status": "published"
        }
        
        success, data = self.make_request('POST', '/articles', article_data)
        if success and 'id' in data:
            self.test_article_id = data['id']
            self.log_test("Create Article", True, f"Created article: {data['title']}")
        else:
            self.log_test("Create Article", False, f"Error: {data}")
            return
        
        # Get article
        success, data = self.make_request('GET', f'/articles/{self.test_article_id}')
        self.log_test("Get Article", success,
                     f"Retrieved: {data.get('title', 'Unknown')}" if success else f"Error: {data}")
        
        # List articles
        success, data = self.make_request('GET', '/articles')
        self.log_test("List Articles", success,
                     f"Found {len(data)} articles" if success else f"Error: {data}")

    def test_grievance_crud(self):
        """Test grievance CRUD operations"""
        # Create grievance (public endpoint)
        grievance_data = {
            "name": "Test Citizen",
            "phone": "+91-9876543210",
            "email": "citizen@example.com",
            "constituency_id": self.test_constituency_id,
            "category": "Infrastructure",
            "description": "Test grievance about road conditions"
        }
        
        success, data = self.make_request('POST', '/grievances', grievance_data)
        if success and 'id' in data:
            self.test_grievance_id = data['id']
            self.log_test("Create Grievance", True, f"Created grievance from: {data['name']}")
        else:
            self.log_test("Create Grievance", False, f"Error: {data}")
            return
        
        # List grievances (admin only)
        success, data = self.make_request('GET', '/grievances')
        self.log_test("List Grievances", success,
                     f"Found {len(data)} grievances" if success else f"Error: {data}")
        
        # Update grievance status
        update_data = {
            "status": "in_progress",
            "admin_notes": "Grievance is being reviewed"
        }
        success, data = self.make_request('PUT', f'/grievances/{self.test_grievance_id}', update_data)
        self.log_test("Update Grievance", success,
                     f"Updated status to: {data.get('status', 'Unknown')}" if success else f"Error: {data}")

    def test_volunteer_crud(self):
        """Test volunteer CRUD operations"""
        # Create volunteer (public endpoint)
        volunteer_data = {
            "name": "Test Volunteer",
            "phone": "+91-9876543210",
            "email": "volunteer@example.com",
            "constituency_id": self.test_constituency_id,
            "skills": ["Social Media", "Event Management"],
            "availability": "Weekends"
        }
        
        success, data = self.make_request('POST', '/volunteers', volunteer_data)
        if success and 'id' in data:
            self.test_volunteer_id = data['id']
            self.log_test("Create Volunteer", True, f"Created volunteer: {data['name']}")
        else:
            self.log_test("Create Volunteer", False, f"Error: {data}")
            return
        
        # List volunteers (admin only)
        success, data = self.make_request('GET', '/volunteers')
        self.log_test("List Volunteers", success,
                     f"Found {len(data)} volunteers" if success else f"Error: {data}")

    def test_event_crud(self):
        """Test event CRUD operations"""
        # Create event
        event_data = {
            "title": "Test Community Event",
            "description": "A test event for the community",
            "event_date": "2024-12-25",
            "event_time": "10:00 AM",
            "location": "Community Hall",
            "constituency_id": self.test_constituency_id,
            "event_type": "public"
        }
        
        success, data = self.make_request('POST', '/events', event_data)
        if success and 'id' in data:
            self.test_event_id = data['id']
            self.log_test("Create Event", True, f"Created event: {data['title']}")
        else:
            self.log_test("Create Event", False, f"Error: {data}")
            return
        
        # Get event
        success, data = self.make_request('GET', f'/events/{self.test_event_id}')
        self.log_test("Get Event", success,
                     f"Retrieved: {data.get('title', 'Unknown')}" if success else f"Error: {data}")
        
        # List events
        success, data = self.make_request('GET', '/events')
        self.log_test("List Events", success,
                     f"Found {len(data)} events" if success else f"Error: {data}")

    def test_geography_tree(self):
        """Test geography tree endpoint"""
        success, data = self.make_request('GET', '/geography/tree')
        if success:
            tree_info = f"Found {len(data)} constituencies in tree"
            self.log_test("Geography Tree", True, tree_info)
        else:
            self.log_test("Geography Tree", False, f"Error: {data}")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete in reverse order of creation
        if self.test_event_id:
            success, _ = self.make_request('DELETE', f'/events/{self.test_event_id}')
            print(f"   Event cleanup: {'✅' if success else '❌'}")
        
        if self.test_article_id:
            success, _ = self.make_request('DELETE', f'/articles/{self.test_article_id}')
            print(f"   Article cleanup: {'✅' if success else '❌'}")
        
        if self.test_leader_id:
            success, _ = self.make_request('DELETE', f'/leaders/{self.test_leader_id}')
            print(f"   Leader cleanup: {'✅' if success else '❌'}")
        
        if self.test_sub_region_id:
            success, _ = self.make_request('DELETE', f'/sub-regions/{self.test_sub_region_id}')
            print(f"   Sub-region cleanup: {'✅' if success else '❌'}")
        
        if self.test_constituency_id:
            success, _ = self.make_request('DELETE', f'/constituencies/{self.test_constituency_id}')
            print(f"   Constituency cleanup: {'✅' if success else '❌'}")
        
        if self.test_district_id:
            success, _ = self.make_request('DELETE', f'/districts/{self.test_district_id}')
            print(f"   District cleanup: {'✅' if success else '❌'}")
        
        if self.test_state_id:
            success, _ = self.make_request('DELETE', f'/states/{self.test_state_id}')
            print(f"   State cleanup: {'✅' if success else '❌'}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Indian Profiles API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity
        self.test_root_endpoint()
        
        # Authentication
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
        
        self.test_auth_me()
        self.test_stats_endpoint()
        
        # CRUD operations - Geography hierarchy
        self.test_state_crud()
        self.test_district_crud()
        self.test_constituency_crud()
        self.test_sub_region_crud()
        self.test_leader_crud()
        self.test_article_crud()
        self.test_grievance_crud()
        self.test_volunteer_crud()
        self.test_event_crud()
        
        # Additional endpoints
        self.test_geography_tree()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   • {failure}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = IndianProfilesAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())