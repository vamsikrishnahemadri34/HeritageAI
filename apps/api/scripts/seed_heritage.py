import sys
from pathlib import Path

API_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_DIR))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.heritage_models import HeritageSite

# Additive and idempotent: existing records are never overwritten.
sites = [
    {
        'name': 'Red Fort',
        'description': 'A monumental red sandstone Mughal fort built by Shah Jahan as the palace-fortress of Shahjahanabad.',
        'category': 'Fort',
        'location': 'Old Delhi',
        'state': 'Delhi',
        'country': 'India',
        'historical_period': '17th century Mughal period',
        'latitude': 28.6562,
        'longitude': 77.241,
    },
    {
        'name': 'Qutub Minar',
        'description': 'A towering minaret begun by Qutb al-Din Aibak and continued by later Delhi Sultanate rulers. The surrounding complex preserves important early Indo-Islamic monuments and inscriptions.',
        'category': 'Monument',
        'location': 'Mehrauli, Delhi',
        'state': 'Delhi',
        'country': 'India',
        'historical_period': 'Delhi Sultanate, 12th–13th centuries',
        'latitude': 28.5245,
        'longitude': 77.1855,
    },
    {
        'name': 'Ajanta Caves',
        'description': 'A celebrated group of Buddhist rock-cut caves with monasteries, prayer halls, sculptures and paintings that preserve evidence of Buddhist art across several centuries.',
        'category': 'Cave',
        'location': 'Ajanta',
        'state': 'Maharashtra',
        'country': 'India',
        'historical_period': '2nd century BCE–6th century CE',
        'latitude': 20.5519,
        'longitude': 75.7033,
    },
    {
        'name': 'Ellora Caves',
        'description': 'A vast rock-cut complex of Buddhist, Hindu and Jain monuments. The Kailasa temple is a monumental example of architecture excavated from a single rock mass.',
        'category': 'Cave',
        'location': 'Ellora',
        'state': 'Maharashtra',
        'country': 'India',
        'historical_period': '6th–10th centuries CE',
        'latitude': 20.0268,
        'longitude': 75.179,
    },
    {
        'name': 'Fatehpur Sikri',
        'description': 'The planned Mughal capital established by Emperor Akbar, known for its palaces, courtyards, audience halls and religious buildings.',
        'category': 'Historic City',
        'location': 'Fatehpur Sikri',
        'state': 'Uttar Pradesh',
        'country': 'India',
        'historical_period': '16th century Mughal period',
        'latitude': 27.0945,
        'longitude': 77.6679,
    },
    {
        'name': 'Khajuraho Temples',
        'description': 'A group of medieval Hindu and Jain temples renowned for detailed stone carving and distinctive architecture, built under the Chandela dynasty.',
        'category': 'Temple',
        'location': 'Khajuraho',
        'state': 'Madhya Pradesh',
        'country': 'India',
        'historical_period': 'Chandela period, 10th–12th centuries',
        'latitude': 24.8318,
        'longitude': 79.9199,
    },
    {
        'name': 'Brihadeeswarar Temple',
        'description': 'A monumental Shiva temple built by Chola emperor Rajaraja I at Thanjavur. Its soaring vimana and inscriptions make it a landmark of Chola architecture.',
        'category': 'Temple',
        'location': 'Thanjavur',
        'state': 'Tamil Nadu',
        'country': 'India',
        'historical_period': 'Chola period, 11th century',
        'latitude': 10.7828,
        'longitude': 79.1318,
    },
    {
        'name': 'Meenakshi Amman Temple',
        'description': 'A major temple complex in Madurai dedicated to Goddess Meenakshi and Lord Sundareswarar, known for towering gopurams and sculpted corridors.',
        'category': 'Temple',
        'location': 'Madurai',
        'state': 'Tamil Nadu',
        'country': 'India',
        'historical_period': 'Pandya origins; later Nayak expansions',
        'latitude': 9.9195,
        'longitude': 78.1193,
    },
    {
        'name': 'Rani ki Vav',
        'description': 'An intricately ornamented stepwell commissioned by Queen Udayamati in memory of King Bhima I, with carved pillars, niches and sculptures.',
        'category': 'Stepwell',
        'location': 'Patan',
        'state': 'Gujarat',
        'country': 'India',
        'historical_period': '11th century Solanki period',
        'latitude': 23.8589,
        'longitude': 72.1019,
    },
    {
        'name': 'Jantar Mantar',
        'description': 'An astronomical observatory built by Maharaja Sawai Jai Singh II, containing monumental instruments designed to observe celestial movements and measure time.',
        'category': 'Observatory',
        'location': 'Jaipur',
        'state': 'Rajasthan',
        'country': 'India',
        'historical_period': '18th century',
        'latitude': 26.9248,
        'longitude': 75.8246,
    },
    {
        'name': 'Mahabalipuram Monuments',
        'description': 'A coastal group of Pallava-era monuments including rock-cut caves, monolithic rathas, sculpted reliefs and the Shore Temple.',
        'category': 'Monument',
        'location': 'Mamallapuram',
        'state': 'Tamil Nadu',
        'country': 'India',
        'historical_period': 'Pallava period, 7th–8th centuries',
        'latitude': 12.6208,
        'longitude': 80.1945,
    },
    {
        'name': 'Victoria Memorial',
        'description': 'A white-marble monument in Kolkata built in memory of Queen Victoria. Its architecture combines European classical forms with influences from Mughal design.',
        'category': 'Monument',
        'location': 'Kolkata',
        'state': 'West Bengal',
        'country': 'India',
        'historical_period': 'British colonial period, early 20th century',
        'latitude': 22.5448,
        'longitude': 88.3426,
    },
]

db = SessionLocal()
added = 0
try:
    existing_names = {name.casefold() for name in db.scalars(select(HeritageSite.name)).all()}
    for item in sites:
        if item["name"].casefold() in existing_names:
            continue
        db.add(HeritageSite(**item))
        existing_names.add(item["name"].casefold())
        added += 1
    db.commit()
    total = len(db.scalars(select(HeritageSite.id)).all())
    print(f"PASS: Added {added} heritage sites.")
    print(f"Total heritage sites in database: {total}")
except Exception:
    db.rollback()
    raise
finally:
    db.close()
