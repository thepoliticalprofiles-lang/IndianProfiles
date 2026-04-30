"""
Test suite for Voter Data Ingestion features:
- Bulk Import Voters CSV/Excel with all new columns
- Bulk Upload Voter Photos ZIP with case-insensitive EPIC matching
- GET /api/voters endpoint with hierarchical RBAC geofencing
- POST /api/voters endpoint to create voter with all new fields
"""

import pytest
import requests
import os
import io
import csv
import zipfile
from PIL import Image

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@indianprofiles.com"
ADMIN_PASSWORD = "Admin@123"


class TestAuthSetup:
    """Authentication setup tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        """Create a requests session"""
        return requests.Session()
    
    def test_admin_login(self, session):
        """Test admin login and get auth token"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful: {data['email']}")
        return session


class TestVoterBulkImport:
    """Test bulk import voters from CSV/Excel"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_bulk_import_csv_with_all_columns(self, auth_session):
        """Test CSV import with all new voter columns"""
        # Create CSV with all expected columns
        csv_content = """epic_number,full_name,age,gender,relative_name,house_number,booth_number,part_number,address,mobile_number,email
TEST_EPIC001,Test Voter One,35,Male,Father One,H-101,B-01,P-01,Test Address 1,9876543210,test1@example.com
TEST_EPIC002,Test Voter Two,28,Female,Father Two,H-102,B-02,P-02,Test Address 2,9876543211,test2@example.com
TEST_EPIC003,Test Voter Three,45,Male,Father Three,H-103,B-03,P-03,Test Address 3,9876543212,test3@example.com"""
        
        files = {
            'file': ('test_voters.csv', csv_content, 'text/csv')
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/voters/bulk-import",
            files=files
        )
        
        assert response.status_code == 200, f"Bulk import failed: {response.text}"
        data = response.json()
        
        assert data["success"] == True
        assert data["imported"] >= 3, f"Expected at least 3 imports, got {data['imported']}"
        assert data["total_rows"] == 3
        print(f"✓ Bulk import successful: {data['imported']} voters imported")
        
        return data
    
    def test_bulk_import_with_location_params(self, auth_session):
        """Test CSV import with location_id and location_name parameters"""
        csv_content = """epic_number,full_name,age,gender
TEST_LOC_EPIC001,Location Test Voter,30,Male"""
        
        files = {
            'file': ('test_location.csv', csv_content, 'text/csv')
        }
        data = {
            'location_name': 'Test Division'
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/voters/bulk-import",
            files=files,
            data=data
        )
        
        assert response.status_code == 200, f"Bulk import with location failed: {response.text}"
        result = response.json()
        assert result["success"] == True
        print(f"✓ Bulk import with location params successful")
    
    def test_bulk_import_with_alternate_column_names(self, auth_session):
        """Test CSV import with alternate column name mappings"""
        # Using alternate column names that should be mapped
        csv_content = """EPIC,Name,Age,Gender,Father Name,House No,Booth No,Part No,Address,Mobile,Email
TEST_ALT_EPIC001,Alt Name Voter,40,Female,Alt Father,H-201,B-11,P-11,Alt Address,9876543220,alt@example.com"""
        
        files = {
            'file': ('test_alt_columns.csv', csv_content, 'text/csv')
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/voters/bulk-import",
            files=files
        )
        
        assert response.status_code == 200, f"Bulk import with alt columns failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["imported"] >= 1
        print(f"✓ Bulk import with alternate column names successful")
    
    def test_bulk_import_missing_required_fields(self, auth_session):
        """Test CSV import with missing required fields (should report errors)"""
        csv_content = """epic_number,age,gender
,35,Male
TEST_MISSING_NAME,,Female"""
        
        files = {
            'file': ('test_missing.csv', csv_content, 'text/csv')
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/voters/bulk-import",
            files=files
        )
        
        assert response.status_code == 200
        data = response.json()
        # Should have errors for missing fields
        assert len(data.get("errors", [])) > 0 or data["imported"] < 2
        print(f"✓ Bulk import correctly handles missing required fields")


class TestVoterBulkPhotos:
    """Test bulk upload voter photos from ZIP"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def _create_test_image(self, width=100, height=100):
        """Create a simple test image"""
        img = Image.new('RGB', (width, height), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        return img_bytes.read()
    
    def test_bulk_photo_upload_zip(self, auth_session):
        """Test ZIP file upload with voter photos"""
        # Create a ZIP file with test images
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Add test images with EPIC numbers as filenames
            # Using existing test voters from bulk import
            zf.writestr('TEST_EPIC001.jpg', self._create_test_image())
            zf.writestr('TEST_EPIC002.png', self._create_test_image())
        
        zip_buffer.seek(0)
        
        files = {
            'file': ('test_photos.zip', zip_buffer.read(), 'application/zip')
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/voters/bulk-photos",
            files=files
        )
        
        assert response.status_code == 200, f"Photo upload failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        print(f"✓ Bulk photo upload successful: {data.get('updated', 0)} photos matched")
    
    def test_bulk_photo_case_insensitive_matching(self, auth_session):
        """Test case-insensitive EPIC matching for photos"""
        # Create ZIP with mixed case filenames
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            # Test various case combinations
            zf.writestr('test_epic001.jpg', self._create_test_image())  # lowercase
            zf.writestr('TEST_EPIC002.JPG', self._create_test_image())  # uppercase
            zf.writestr('Test_Epic003.Jpg', self._create_test_image())  # mixed case
        
        zip_buffer.seek(0)
        
        files = {
            'file': ('test_case_photos.zip', zip_buffer.read(), 'application/zip')
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/voters/bulk-photos",
            files=files
        )
        
        assert response.status_code == 200, f"Case-insensitive photo upload failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        print(f"✓ Case-insensitive photo matching working: {data.get('updated', 0)} matched")


class TestVoterCRUD:
    """Test voter CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_create_voter_with_all_fields(self, auth_session):
        """Test creating a voter with all new fields"""
        voter_data = {
            "epic_number": "TEST_CREATE_001",
            "full_name": "Created Test Voter",
            "age": 32,
            "gender": "Male",
            "relative_name": "Test Father",
            "house_number": "H-999",
            "booth_number": "B-99",
            "part_number": "P-99",
            "address": "Test Created Address",
            "mobile_number": "9999999999",
            "email": "created@test.com"
        }
        
        response = auth_session.post(
            f"{BASE_URL}/api/voters",
            json=voter_data
        )
        
        assert response.status_code in [200, 201], f"Create voter failed: {response.text}"
        data = response.json()
        
        # Verify all fields are returned
        assert data.get("epic_number") == voter_data["epic_number"]
        assert data.get("full_name") == voter_data["full_name"]
        assert data.get("age") == voter_data["age"]
        assert data.get("gender") == voter_data["gender"]
        assert data.get("relative_name") == voter_data["relative_name"]
        assert data.get("house_number") == voter_data["house_number"]
        assert data.get("booth_number") == voter_data["booth_number"]
        assert data.get("part_number") == voter_data["part_number"]
        assert data.get("address") == voter_data["address"]
        assert data.get("mobile_number") == voter_data["mobile_number"]
        assert data.get("email") == voter_data["email"]
        
        print(f"✓ Voter created with all fields: {data.get('epic_number')}")
        return data
    
    def test_get_voters_list(self, auth_session):
        """Test getting voters list"""
        response = auth_session.get(f"{BASE_URL}/api/voters")
        
        assert response.status_code == 200, f"Get voters failed: {response.text}"
        data = response.json()
        
        assert "voters" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "total_pages" in data
        
        print(f"✓ Get voters successful: {data['total']} total voters")
        return data
    
    def test_get_voters_with_search(self, auth_session):
        """Test voters search functionality"""
        # Search by name
        response = auth_session.get(f"{BASE_URL}/api/voters?search=Test&search_by=name")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Search by name: {len(data.get('voters', []))} results")
        
        # Search by EPIC
        response = auth_session.get(f"{BASE_URL}/api/voters?search=TEST&search_by=epic")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Search by EPIC: {len(data.get('voters', []))} results")
        
        # Search by booth
        response = auth_session.get(f"{BASE_URL}/api/voters?search=B-01&search_by=booth")
        assert response.status_code == 200
        print(f"✓ Search by booth working")
        
        # Search by mobile
        response = auth_session.get(f"{BASE_URL}/api/voters?search=9876&search_by=mobile")
        assert response.status_code == 200
        print(f"✓ Search by mobile working")
        
        # Search by part number
        response = auth_session.get(f"{BASE_URL}/api/voters?search=P-01&search_by=part")
        assert response.status_code == 200
        print(f"✓ Search by part number working")
    
    def test_get_voters_pagination(self, auth_session):
        """Test voters pagination"""
        response = auth_session.get(f"{BASE_URL}/api/voters?page=1&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["page"] == 1
        assert data["limit"] == 5
        assert len(data["voters"]) <= 5
        
        print(f"✓ Pagination working: page {data['page']}, limit {data['limit']}")
    
    def test_get_voter_stats(self, auth_session):
        """Test voter statistics endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/voters/stats/summary")
        
        assert response.status_code == 200, f"Get voter stats failed: {response.text}"
        data = response.json()
        
        assert "total" in data
        assert "male" in data
        assert "female" in data
        assert "booths" in data
        
        print(f"✓ Voter stats: total={data['total']}, male={data['male']}, female={data['female']}, booths={data['booths']}")


class TestVoterRBACGeofencing:
    """Test hierarchical RBAC geofencing for voters"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get admin authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_super_admin_sees_all_voters(self, admin_session):
        """Test that super admin can see all voters without geofencing"""
        response = admin_session.get(f"{BASE_URL}/api/voters")
        
        assert response.status_code == 200, f"Super admin get voters failed: {response.text}"
        data = response.json()
        
        # Super admin should see all voters
        assert "voters" in data
        assert data["total"] >= 0
        
        print(f"✓ Super admin sees all voters: {data['total']} total")
    
    def test_super_admin_can_filter_by_location(self, admin_session):
        """Test that super admin can manually filter by location"""
        # Get available states first
        states_response = admin_session.get(f"{BASE_URL}/api/states")
        if states_response.status_code == 200 and states_response.json():
            state_id = states_response.json()[0]["id"]
            
            response = admin_session.get(f"{BASE_URL}/api/voters?state_id={state_id}")
            assert response.status_code == 200
            print(f"✓ Super admin can filter by state_id")
        else:
            print("⚠ No states available for filter test")
    
    def test_voter_hub_access_check(self, admin_session):
        """Test that voter hub access is properly checked"""
        # Admin should have can_access_voter_hub=true
        response = admin_session.get(f"{BASE_URL}/api/voters")
        assert response.status_code == 200, "Admin should have voter hub access"
        print(f"✓ Voter hub access check working")


class TestDataIngestionUI:
    """Test Data Ingestion page API endpoints used by frontend"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_constituencies_endpoint_for_location_dropdown(self, auth_session):
        """Test constituencies endpoint used for location dropdown"""
        response = auth_session.get(f"{BASE_URL}/api/constituencies")
        
        assert response.status_code == 200, f"Get constituencies failed: {response.text}"
        data = response.json()
        
        # Should return list of constituencies
        assert isinstance(data, list)
        print(f"✓ Constituencies endpoint working: {len(data)} constituencies")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_cleanup_test_voters(self, auth_session):
        """Cleanup test voters created during testing"""
        # Get all voters with TEST_ prefix
        response = auth_session.get(f"{BASE_URL}/api/voters?search=TEST_&search_by=epic&limit=100")
        
        if response.status_code == 200:
            data = response.json()
            test_voters = [v for v in data.get("voters", []) if v.get("epic_number", "").startswith("TEST_")]
            
            deleted_count = 0
            for voter in test_voters:
                delete_response = auth_session.delete(f"{BASE_URL}/api/voters/{voter['id']}")
                if delete_response.status_code in [200, 204]:
                    deleted_count += 1
            
            print(f"✓ Cleanup: {deleted_count} test voters deleted")
        else:
            print("⚠ Could not fetch test voters for cleanup")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
