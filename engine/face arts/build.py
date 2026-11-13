"""Build the current procedural portrait workshop and public offline entry."""
from pathlib import Path
import runpy
import shutil

root = Path(__file__).resolve().parent
runpy.run_path(str(root / 'painted' / 'build.py'), run_name='__main__')
runpy.run_path(str(root / 'grayscale' / 'build.py'), run_name='__main__')
shutil.copyfile(root / 'grayscale' / 'portrait-workshop-grayscale.html', root / 'portrait-workshop.html')
print('Updated portrait-workshop.html (painted art, v7 recipes)')
