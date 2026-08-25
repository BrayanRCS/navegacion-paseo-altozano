import shutil

shutil.copyfile('scratch/gmaps_slate_planta_baja.png', 'planta-baja-dark.png')
shutil.copyfile('scratch/gmaps_slate_planta_uno.png', 'planta-uno-dark.png')
shutil.copyfile('scratch/gmaps_slate_planta_dos.png', 'planta-dos-dark.png')

print("Copied dark mode floor maps to project root successfully!")
