from moviepy import VideoFileClip
import os

files = [
    "首页.mp4",
    "对比模式.mp4",
    "执行路径.mp4",
    "日志丢失.mp4"
]

output_dir = "assets"
os.makedirs(output_dir, exist_ok=True)

for f in files:
    if os.path.exists(f):
        print(f"Converting {f}...")
        try:
            clip = VideoFileClip(f)
            # Resize for web (e.g. width 800) and reduce fps to reduce size
            # If it's the main homepage, maybe keep it larger? But usually 800-1000 is good for README
            # Sub-features can be smaller.
            
            # Let's check aspect.
            # Convert to gif
            output_name = os.path.splitext(f)[0] + ".gif"
            output_path = os.path.join(output_dir, output_name)
            
            # Use 10fps for demo, optimizing for size
            clip.resized(width=800).write_gif(output_path, fps=10)
            print(f"Saved to {output_path}")
        except Exception as e:
            print(f"Failed to convert {f}: {e}")
    else:
        print(f"File {f} not found.")
