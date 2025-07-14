import sass
import os

def compile_sass():
    """
    Compiles the SASS files to CSS.
    """
    try:
        scss_dir = "adwaita-web/scss/"
        files_to_compile = [
            "_fonts.scss",
            "_variables.scss",
            "_mixins.scss",
            "_base.scss",
            "_utility_classes.scss",
            "_button.scss",
            "_entry.scss",
            "_headerbar.scss",
            "_card.scss",
            "_listbox.scss",
            "_dialog.scss",
            "_about_dialog.scss",
            "_row_types.scss",
            "_action_row.scss",
            "_entry_row.scss",
            "_expander_row.scss",
            "_switch.scss",
            "_checkbox.scss",
            "_radio.scss",
            "_label.scss",
            "_icon.scss",
            "_symbolic_icons.scss",
            "_avatar.scss",
            "_spinner.scss",
            "_progressbar.scss",
            "_toast.scss",
            "_toast_overlay.scss",
            "_banner.scss",
            "_popover.scss",
            "_tabs.scss",
            "_toolbar_view.scss",
            "_viewswitcher.scss",
            "_spin_button.scss",
            "_status_page.scss",
            "_preferences.scss",
            "_switch_row.scss",
            "_split_button.scss",
            "_toggle_group.scss",
            "_inline_view_switcher.scss",
            "_button_row.scss",
            "_shortcut_label.scss",
            "_bottom_sheet.scss",
            "_combo_row.scss",
            "_box.scss",
            "_wrap_box.scss",
            "_clamp.scss",
            "_window.scss",
            "_antisocialnet-specific.scss"
        ]

        all_scss_content = ""
        for filename in files_to_compile:
            with open(os.path.join(scss_dir, filename), "r") as f:
                all_scss_content += f.read() + "\n"

        css_content = sass.compile(string=all_scss_content, output_style="compressed")

        with open("adwaita-web/css/adwaita-skin.css", "w") as f:
            f.write(css_content)

        print("SASS compilation successful.")
    except Exception as e:
        print(f"SASS compilation failed: {e}")

if __name__ == "__main__":
    compile_sass()
