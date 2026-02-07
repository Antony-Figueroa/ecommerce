
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

jwt_secret = os.getenv('JWT_SECRET', 'farmacia-plus-secret-key-dev-2026')
payload = {
    'id': 'fbfb0a8c-a498-4399-92c9-4ea21e08a1fe',
    'role': 'ADMIN',
    'email': 'admin@farmasiaplus.com'
}

token = jwt.encode(payload, jwt_secret, algorithm='HS256')
print(token)
