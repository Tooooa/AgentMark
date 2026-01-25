from swarm import Swarm, Agent
import os

# 定义简单的工具
def get_weather(location):
    print(f"[Tool] Getting weather for {location}")
    return "{'temp': 67, 'unit': 'F'}"

def transfer_email(to_email):
    print(f"[Tool] Transferring email to {to_email}")
    return "Email transferred"

# 定义 Agent
agent = Agent(
    name="Agent",
    instructions="You are a helpful agent. Always use tools to answer questions.",
    functions=[get_weather, transfer_email],
)

# 初始化 Swarm (使用环境变量中的配置)
print("Initializing Swarm client...")
client = Swarm()

# 运行
print("Running Swarm agent...")
messages = [{"role": "user", "content": "What's the weather in NYC? And please transfer email to boss@example.com"}]
try:
    response = client.run(
        agent=agent,
        messages=messages,
    )
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Error running swarm: {e}")
    response = None

print("\n--- Response ---")
print(response.messages[-1]["content"])

# 打印完整的消息历史以检查 tool_calls
print("\n--- Message History ---")
for msg in response.messages:
    role = msg.get("role")
    content = msg.get("content")
    tool_calls = msg.get("tool_calls")
    if tool_calls:
        print(f"[{role}] Tool Calls: {tool_calls}")
    elif content:
        print(f"[{role}] {content}")
