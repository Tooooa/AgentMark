import sys

print("Python path:", sys.path)

try:
    import agents
    print("\n--- agents ---")
    print(dir(agents))
    if hasattr(agents, 'Agent'):
        print("Agent class found in agents")
    if hasattr(agents, 'Runner'):
        print("Runner class found in agents")
except ImportError as e:
    print(f"\nError importing agents: {e}")

try:
    import openai_agents
    print("\n--- openai_agents ---")
    print(dir(openai_agents))
except ImportError as e:
    print(f"\nError importing openai_agents: {e}")
