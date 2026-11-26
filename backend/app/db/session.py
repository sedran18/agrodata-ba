from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from os import environ
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(environ['DATABASE_URL'])

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)