import aiohttp
import asyncio
from datetime import datetime

# In-memory store
sites = {}  # {url: {"status": "UP"/"DOWN", "last_checked": datetime}}

async def check_site(url):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=5):
                return "UP"
    except:
        return "DOWN"

async def auto_monitor():
    while True:
        for url in list(sites.keys()):
            status = await check_site(url)
            sites[url] = {
                "status": status,
                "last_checked": datetime.now().isoformat()
            }
        await asyncio.sleep(60)
