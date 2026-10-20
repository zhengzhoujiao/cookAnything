"""Configuration guards and a real-Mongo application smoke test.

Set TEST_MONGODB_URL to an isolated MongoDB instance to enable integration tests.
All test credentials, database names and fake provider keys are generated at runtime.
No request is sent to a paid AI service.
"""
from datetime import timedelta
import logging
import os
from pathlib import Path
import secrets
import sys
import unittest
from unittest.mock import patch

from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
INITIAL_PASSWORD = secrets.token_urlsafe(24)
SIGNING_KEY = secrets.token_hex(32)
os.environ.update({
    "SECRET_KEY": SIGNING_KEY,
    "ADMIN_INITIAL_PASSWORD": INITIAL_PASSWORD,
    "MONGODB_URL": os.getenv("TEST_MONGODB_URL", "mongodb://127.0.0.1:27019"),
    "DATABASE_NAME": "recipe_test_" + secrets.token_hex(8),
    "API_PATH_PREFIX": "/wte-api",
})

from config import Settings, settings
from auth import create_access_token, verify_token
from models import ChangePasswordRequest


class ConfigurationTests(unittest.TestCase):
    def test_required_credentials(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValidationError) as error:
                Settings(_env_file=None)
            self.assertIn("secret_key", str(error.exception))
            self.assertIn("admin_initial_password", str(error.exception))

    def test_rejects_weak_shared_and_placeholder_credentials(self):
        for key, password in [
            ("short", INITIAL_PASSWORD),
            (SIGNING_KEY, "short"),
            (SIGNING_KEY, SIGNING_KEY),
            ("replace-" * 8, INITIAL_PASSWORD),
            (SIGNING_KEY, "your-password-goes-here"),
        ]:
            with self.subTest(case="invalid credentials"):
                with self.assertRaises(ValidationError) as error:
                    Settings(_env_file=None, secret_key=key, admin_initial_password=password)
                self.assertNotIn(SIGNING_KEY, str(error.exception))
                self.assertNotIn(INITIAL_PASSWORD, str(error.exception))

    def test_credentials_are_masked_in_settings(self):
        self.assertNotIn(SIGNING_KEY, repr(settings))
        self.assertNotIn(INITIAL_PASSWORD, repr(settings))

    def test_tokens_verify_and_expire(self):
        self.assertEqual(verify_token(create_access_token({"sub": "admin"}))["sub"], "admin")
        expired = create_access_token({"sub": "admin"}, timedelta(seconds=-1))
        self.assertIsNone(verify_token(expired))
        self.assertIsNone(verify_token("invalid"))

    def test_new_password_strength_and_bcrypt_byte_limit(self):
        for password in ["short", "\u5bc6" * 25]:
            with self.assertRaises(ValidationError):
                ChangePasswordRequest(old_password=INITIAL_PASSWORD, new_password=password)


class FakeResponse:
    def __init__(self, data):
        self.data = data

    def model_dump(self):
        return self.data


class FakeResponses:
    async def create(self, **kwargs):
        return FakeResponse({"output_text": "Recipe service smoke test passed"})


class FakeImages:
    async def generate(self, **kwargs):
        return FakeResponse({"data": [{"url": "https://example.com/test-image.png"}]})


class FakeAI:
    def __init__(self, **kwargs):
        self.responses = FakeResponses()
        self.images = FakeImages()


@unittest.skipUnless(os.getenv("TEST_MONGODB_URL"), "Set TEST_MONGODB_URL for real MongoDB smoke tests")
class ApplicationSmokeTests(unittest.TestCase):
    def test_initialization_login_configuration_proxy_and_password_change(self):
        from fastapi.testclient import TestClient
        from pymongo import MongoClient
        import main

        sync_client = MongoClient(settings.mongodb_url, serverSelectionTimeoutMS=10000)
        database = sync_client[settings.database_name]
        provider_key = secrets.token_urlsafe(32)
        changed_password = secrets.token_urlsafe(24)
        try:
            with self.assertLogs(level=logging.INFO) as captured:
                with TestClient(main.app) as client, patch("routes.ai_proxy.AsyncOpenAI", FakeAI):
                    self.assertEqual(client.get("/health").status_code, 200)
                    self.assertIn(client.get("/wte-api/admin/settings").status_code, (401, 403))
                    self.assertEqual(client.post("/wte-api/admin/login", json={"password": "wrong"}).status_code, 401)
                    login = client.post("/wte-api/admin/login", json={"password": INITIAL_PASSWORD})
                    self.assertEqual(login.status_code, 200)
                    headers = {"Authorization": "Bearer " + login.json()["access_token"]}
                    self.assertNotEqual(database.admin.find_one({})["hashed_password"], INITIAL_PASSWORD)
                    self.assertEqual(database.ai_settings.count_documents({}), 2)
                    config = client.get("/wte-api/admin/settings", headers=headers).json()
                    self.assertEqual(config["text_generation"]["api_key"], "")
                    self.assertEqual(client.post("/wte-api/ai/chat", json={"messages": []}).status_code, 503)
                    for kind in ("text_generation", "image_generation"):
                        config[kind].update(base_url="https://example.com/api/v3", api_key=provider_key, model="test-model")
                    self.assertEqual(client.put("/wte-api/admin/settings", headers=headers, json=config).status_code, 200)
                    chat = client.post("/wte-api/ai/chat", json={"messages": [{"role": "user", "content": "hello"}]})
                    self.assertEqual(chat.status_code, 200)
                    self.assertIn("choices", chat.json())
                    image = client.post("/wte-api/ai/images", json={"prompt": "A bowl of rice"})
                    self.assertEqual(image.status_code, 200)
                    self.assertIn("data", image.json())
                    self.assertEqual(client.put("/wte-api/admin/password", headers=headers, json={"old_password": INITIAL_PASSWORD, "new_password": "short"}).status_code, 422)
                    self.assertEqual(client.put("/wte-api/admin/password", headers=headers, json={"old_password": INITIAL_PASSWORD, "new_password": changed_password}).status_code, 200)
                    self.assertEqual(client.post("/wte-api/admin/login", json={"password": INITIAL_PASSWORD}).status_code, 401)
                    self.assertEqual(client.post("/wte-api/admin/login", json={"password": changed_password}).status_code, 200)
            logs = "\n".join(captured.output)
            for private_value in (INITIAL_PASSWORD, changed_password, SIGNING_KEY, provider_key):
                self.assertNotIn(private_value, logs)
        finally:
            sync_client.drop_database(settings.database_name)
            sync_client.close()


if __name__ == "__main__":
    unittest.main()
