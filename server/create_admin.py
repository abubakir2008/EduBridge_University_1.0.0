"""
Run inside the app container:
  docker exec -it edubridge_app python create_admin.py
  docker exec -it edubridge_app python create_admin.py --reset
"""
import sys
import uuid
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole, AccountStatus

EMAIL    = "admin@university.kg"
LOGIN    = "admin"
PASSWORD = "Admin123456"
FULLNAME = "Администратор"

# Use sync psycopg2 URL (strip async prefix if present)
db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

engine = create_engine(db_url, echo=False)


def create_admin() -> None:
    with Session(engine) as session:
        existing = session.execute(
            select(User).where((User.email == EMAIL) | (User.login == LOGIN))
        ).scalar_one_or_none()

        if existing:
            if existing.role != UserRole.admin:
                existing.role = UserRole.admin
                existing.password_hash = hash_password(PASSWORD)
                session.commit()
                print(f"[updated] {EMAIL} → роль admin, пароль сброшен")
            else:
                print(f"[exists]  {EMAIL} уже является администратором")
                if "--reset" in sys.argv:
                    existing.password_hash = hash_password(PASSWORD)
                    session.commit()
                    print(f"[reset]   пароль обновлён → {PASSWORD}")
                else:
                    print("         Для сброса пароля: python create_admin.py --reset")
            return

        admin = User(
            id=uuid.uuid4(),
            full_name=FULLNAME,
            email=EMAIL,
            login=LOGIN,
            password_hash=hash_password(PASSWORD),
            role=UserRole.admin,
            account_status=AccountStatus.active,
        )
        session.add(admin)
        session.commit()
        print("[created] Администратор создан:")
        print(f"  email:    {EMAIL}")
        print(f"  login:    {LOGIN}")
        print(f"  password: {PASSWORD}")


if __name__ == "__main__":
    create_admin()
