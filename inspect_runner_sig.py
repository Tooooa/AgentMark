from agents import Runner
import inspect

print("Runner.run signature:")
print(inspect.signature(Runner.run))
print("\nRunner docstring:")
print(Runner.run.__doc__)
