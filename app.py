import streamlit as st
from pathlib import Path
import random
from PIL import Image

##############################################
# ------------  CONFIG  ------------#
##############################################

TAC_DIR = Path("stimuli/tact")    
REF_DIR = Path("stimuli/reference")  # reference objects for prepositions

# sight‑word list (to be swapped with file read later, or maybe RBT will enter idk)
SIGHT_WORDS = [
    "Look", "Go", "Come", "Stop", "Up", "Down",
    "Yes", "No", "Big", "Small"
]

PREPOSITIONS = ["under", "over", "beside", "on", "in"]

PROGRAMS = [
    "Tact / Receptive ID",  # shares same stimuli & UI
    "Sight Words",
    "Prepositions"
]

##############################################
# ---------------- HELPERS - i will move this to utils later ------------------#
##############################################

def load_images(folder: Path):
    return sorted(list(folder.glob("*.png")) + list(folder.glob("*.jpg")))


def choose(imgs):
    return random.choice(imgs) if imgs else None


def show_center_image(img_path: Path, caption: str | None = None):
    if not img_path or not img_path.exists():
        st.warning(f"Missing image: {img_path}")
        return
    img = Image.open(img_path)
    st.image(img, width=min(400, img.width), caption=caption)


def show_big_word(word: str):
    st.markdown(
        f"<h1 style='text-align:center; font-size:72px;'>{word}</h1>",
        unsafe_allow_html=True,
    )


def render_preposition_scene(subject: Path, reference: Path, prep: str):
    if prep in ("over", "on"):
        show_center_image(subject)
        show_center_image(reference)
    elif prep == "under":
        show_center_image(reference)
        show_center_image(subject)
    elif prep == "beside":
        c1, c2 = st.columns(2)
        with c1:
            show_center_image(subject)
        with c2:
            show_center_image(reference)
    elif prep == "in": 
        show_center_image(reference)
        st.markdown("<div style='position:relative; top:-250px;'>", unsafe_allow_html=True)
        show_center_image(subject)
        st.markdown("</div>", unsafe_allow_html=True)

##############################################
# ----------------  UI SETUP  ---------------#
##############################################

st.set_page_config(page_title="CentralTeach", layout="wide")

# --- SIDEBAR: build the queue ----
st.sidebar.header("Program Queue")
open_tabs_default = st.session_state.get("open_tabs", [])
queue = st.sidebar.multiselect(
    "Select programs to run (order = tab order)",
    PROGRAMS,
    default=open_tabs_default,
)

# ensure order
st.session_state.open_tabs = [p for p in PROGRAMS if p in queue]

if not st.session_state.open_tabs:
    st.info("Choose at least one program from the sidebar!")
    st.stop()

tabs = st.tabs(st.session_state.open_tabs)

# preload image sets
TAC_IMAGES = load_images(TAC_DIR)
REF_IMAGES = load_images(REF_DIR)

for prog_name, tab in zip(st.session_state.open_tabs, tabs):
    with tab:
        # button unique per program
        shuffle_key = f"shuffle_{prog_name}"
        if st.button("Shuffle / Next", key=shuffle_key + "btn"):
            st.session_state[shuffle_key] = True

        # first visit defaults to shuffle
        if shuffle_key not in st.session_state:
            st.session_state[shuffle_key] = True

        if prog_name == "Tact / Receptive ID":
            st.subheader("Tact / Expressive ID")
            if st.session_state[shuffle_key]:
                st.session_state.current_tact = choose(TAC_IMAGES)
                st.session_state[shuffle_key] = False
            target = st.session_state.get("current_tact")
            if target:
                show_center_image(target)
                st.markdown("**Prompt:** What is this?")

        elif prog_name == "Sight Words":
            st.subheader("Sight Words")
            if st.session_state[shuffle_key]:
                st.session_state.current_word = choose(SIGHT_WORDS)
                st.session_state[shuffle_key] = False
            word = st.session_state.get("current_word")
            if word:
                show_big_word(word)
                st.markdown("**Prompt:** What does this say?")

        elif prog_name == "Prepositions":
            st.subheader("Prepositions")
            if st.session_state[shuffle_key]:
                subj = choose(TAC_IMAGES)
                ref = choose(REF_IMAGES)
                prep = choose(PREPOSITIONS)
                st.session_state.current_scene = (subj, ref, prep)
                st.session_state[shuffle_key] = False
            subj, ref, prep = st.session_state.get("current_scene", (None, None, None))
            if subj and ref:
                render_preposition_scene(subj, ref, prep)
                st.markdown(
                    f"**Prompt:** Where is the {subj.stem}? → _{prep}_ the {ref.stem}."
                )

# ---- FOOTER ----
st.sidebar.markdown("---")
st.sidebar.caption("CentralTeach MVP · Fart Button © 2025")
if st.button("Fart"):
    st.audio("fart.mp3", format="audio/mp3")
