import socket
import os
import signal
import subprocess
import time

PORT = 8002

def kill_port(port):
    # Try to find pid using ss (available on most linux)
    try:
        cmd = f"ss -lptn 'sport = :{port}'"
        output = subprocess.check_output(cmd, shell=True).decode()
        for line in output.splitlines():
            if f":{port}" in line:
                # format: users:(("python",pid=89836,fd=3))
                if "pid=" in line:
                    parts = line.split("pid=")
                    if len(parts) > 1:
                        pid = int(parts[1].split(",")[0])
                        print(f"Killing PID {pid} on port {port}")
                        try:
                            os.kill(pid, signal.SIGKILL)
                        except ProcessLookupError:
                            pass
    except Exception as e:
        print(f"Failed to use ss: {e}")

    # Fallback: Try fuser
    try:
        subprocess.run(f"fuser -k {port}/tcp", shell=True)
    except Exception:
        pass

if __name__ == "__main__":
    kill_port(PORT)
    time.sleep(1)
    print("Cleanup done.")
