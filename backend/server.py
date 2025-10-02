from fastapi import FastAPI
import asyncio
from monitor import sites, check_site, auto_monitor

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(auto_monitor())

@app.post("/ping")
async def ping(url: str):
    status = await check_site(url)
    sites[url] = {"status": status}
    return {"url": url, "status": status}

@app.get("/status")
async def status():
    return sites
