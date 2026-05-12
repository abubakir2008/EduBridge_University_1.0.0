"""
Run inside the app container:
  docker exec -it edubridge_app python create_admin.py
"""
import sys
import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Must be importable from the project root (/app inside container)
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole, AccountStatus

EMAIL    = "admin@university.kg"
LOGIN    = "admin"
PASSWORD = "Admin123456"
FULLNAME = "Администратор"


async def create_admin() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if already exists
        result = await session.execute(select(User).where(User.email == EMAIL))
        existing = result.scalar_one_or_none()

        if existing:
            if existing.role != UserRole.admin:
                existing.role = UserRole.admin
                existing.password_hash = hash_password(PASSWORD)
                await session.commit()
                print(f"[updated] {EMAIL} → role set to admin, password reset")
            else:
                print(f"[exists]  {EMAIL} is already an admin")
                print("         To reset password re-run with --reset flag:")
                print("         docker exec -it edubridge_app python create_admin.py --reset")
                if "--reset" in sys.argv:
                    existing.password_hash = hash_password(PASSWORD)
                    await session.commit()
                    print("[reset]   password updated")
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
        await session.commit()
        print(f"[created] admin user")
        print(f"  email:    {EMAIL}")
        print(f"  login:    {LOGIN}")
        print(f"  password: {PASSWORD}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_admin())
