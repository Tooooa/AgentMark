from agents import Agent, Runner
import asyncio
import os

# 1. Define tools
def get_weather(location: str) -> str:
    print(f"[Tool] Getting weather for {location}")
    return "{'temp': 25, 'unit': 'C'}"

# 2. Define Agent
agent = Agent(
    name="WeatherBot",
    instructions="You are a helpful assistant. Use tools to check weather.",
    tools=[get_weather],
)

# 3. Define Main Loop
async def main():
    print("Initializing Runner...")
    # Trying to find the right way to instantiate/run Runner based on typical patterns
    # If Runner is a class that holds state or config:
    try:
        runner = Runner()
        # Assume run method signature similar to Swarm/other frameworks
        # Or maybe runner.run(agent=..., messages=...)
        print("Running agent...")
        # We need to pass the user message. 
        # API might be runner.run(agent, input="...") or messages=[...]
        # Let's try input first or inspect run method if it fails.
        # But for 'one shot' scripts usually it's messages or input string.
        
        # Let's try to inspect Runner.run signature dynamically if possible or just guess
        result = await runner.run(
            agent,
            messages=[{"role": "user", "content": "What is the weather in Beijing?"}]
        )
        print("--- Result ---")
        print(result)
        
    except Exception as e:
        print(f"Error running agent: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Ensure env vars are set (though we will set them in CLI)
    print(f"Base URL: {os.getenv('OPENAI_BASE_URL')}")
    asyncio.run(main())
