import os

source_file = "/Users/yang/AiProjects/fat-loss-tracker/frontend/public/css/style.css"
dest_file = "/Users/yang/AiProjects/fat-loss-tracker/frontend/src/components/modals/ProfileModal.vue"

with open(source_file, "r") as f:
    lines = f.readlines()

def find_line(lines, query):
    for i, line in enumerate(lines):
        if query in line:
            return i
    return -1

# Avatars
avatar_start = find_line(lines, "/* ===== 预设头像选择库 ===== */")
# Humanoid
body_start = find_line(lines, "/* ===== 身体围度展开面板 ===== */")
# BMI
bmi_start = find_line(lines, "/* ===== BMI 指示器 ===== */")
# End of Profile specific
profile_end = find_line(lines, "/* =========================================================")

if -1 in [avatar_start, body_start, bmi_start, profile_end]:
    print("Failed to find some sections")
    exit(1)

# Extract only the specific chunks
# Between avatar_start and profile_end
specific_lines = lines[avatar_start:profile_end]

# Delete from source
del lines[avatar_start:profile_end]

with open(source_file, "w") as f:
    f.writelines(lines)

# Append to ProfileModal.vue
css_content = "".join(specific_lines)
with open(dest_file, "a") as f:
    f.write("\n<style scoped>\n")
    f.write(css_content)
    f.write("\n</style>\n")

print("Successfully moved Profile specific CSS!")
