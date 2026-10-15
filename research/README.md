# Research — Ethiopian Sign Language (EthSL)

This folder holds the research artifacts used to scope and train the
Ethiopian Sign Language recognition path in `sign-recognition-service/`.
It contains the three primary documents that ground the dataset strategy:
the published **Scientific Reports** paper, the **Bahir Dar University**
(PhD) continuous-sign thesis, and the **NADRE** alphabet thesis.

---

## Resources

### 1. `gonfa-2025-scientific-reports-ethsl.pdf` — *Science of Communication*
**Published paper.** Scientific Reports (2025), DOI
`10.1038/s41598-025-19937-0`.

- **What it contains:** an evaluation of continuous Ethiopian Sign
  Language (EthSL) recognition from RGB video, using MediaPipe Holistic
  landmarks + CNN/LSTM/GRU classifiers and a benchmark of sign
  "mechanisms" and evaluation protocols.
- **License:** open access under the **Creative Commons Attribution 4.0
  International (CC BY 4.0)** license (`http://creativecommons.org/
  licenses/by/4.0/`). Anyone may share and adapt the article, including
  for commercial purposes, provided attribution is given.
- **Access restrictions:** the article itself is publicly available. The
  **training dataset and trained model weights are not** — in
  crossref/springer records, the underlying dataset is marked as
  *not publicly available* (institutional/privacy restrictions). This is
  the standard pattern for EthSL research: the *numbers* are public, the
  *raw videos* generally are not.
- **Relevance to Ethiopia:** this is the **primary published reference
  for EthSL** recognition in this repository. It supplies:
  - the **5,600 annotated isolated-sign videos / 7 signers** corpus
    description used as dataset **A** in `DATASET.md`;
  - the **signer-dependent (~94%) vs signer-independent (~73%)**
    accuracy gap — the key evaluation principle behind
    `training/split_by_signer.py` (split by *signer*, never by clip);
  - the preprocessing/landmark contract (MediaPipe Holistic) the service
    is built around;
  - the paper's author contact information is listed in its
    published **Author Contributions / Acknowledgments** section and on
    the BDU researcher's profile — use the DOI landing page on
    `https://doi.org/10.1038/s41598-025-19937-0` to find the named
    author and their institution (Bahir Dar University) so you can send a
    polite, license-respecting ask.

> **Why this matters for Ethiopia:** the model behind the InterviewLoop
> sign tab is an **Ethiopian** sign model, not an ASL import. The paper
> proves that signer-independent EthSL recognition is achievable only
> with consented, signer-representative data, and it is the justification
> for the "pilot collection" path in `DATASET.md §2` when research-data
> access is blocked.

### 2. `bdu-thesis-continuous-ethsl-2024.pdf` — *Bahir Dar University (BDU) PhD / MSc thesis, 2024*
**Theses.** Continuous (CTC-based) EthSL recognition, supervised by BDU.

- **What it contains:** the continuous-sign corpus and recognition system
  described in the companion paper (a BDU researcher's doctoral work).
- **License:** **restricted.** It is an institutional thesis, not an open
  dataset. Read it for methodological context (CTC training, sentence
  corpus design), but do **not** treat its internal data or model weights
  as downloadable.
- **Access restrictions:** BDU theses are controlled academic outputs;
  full text may be hosted on the institution's repository (e.g.
  `https://ir.bdu.edu.et/`) for registered readers only. There is no
  guarantee the underlying recordings are shareable.
- **Relevance to Ethiopia:** this is dataset **B** (CESLR-style
  continuous corpus: 1,320 sentence recordings, 30 sentences × 2 takes ×
  22 signers, described in `DATASET.md`). It is the methodological
  reference for **Stage 2 (continuous recognition)** — the next
  progression after the isolated-sign model.

### 3. `nadre-ethsl-alphabet-thesis-2021.pdf` — *NADRE (National Academic Digital Repository of Ethiopia) record 2413, 2021*
**Thesis.** Ethiopian Sign Language alphabet recognition (real-time,
computer-vision + motion sensors).

- **What it contains:** real-time EthSL **fingerspelling/alphabet**
  recognition; an earlier, narrower slice of the same research line.
- **License:** **repository-record only.** It is a NADRE thesis entry,
  not a distributable dataset. Access is through the NADRE record page
  (`https://nadre.ethernet.edu.et/record/2413`), typically for
  registered Ethiopian/Ethiopian-institution users.
- **Access restrictions:** no direct download link is bundled or
  searchable here; treat the PDF as the **prototype and vocabulary
  reference** for the fingerspelling stage, not as a dataset source.
- **Relevance to Ethiopia:** this is dataset **C** (the EthSL alphabet
  research). It informs the **vocabulary / gloss set** for the
  interview-use pilot described in `DATASET.md §2` (greetings, question
  words, numbers, "yes/no", name/place signs).

---

## Data availability & how to request the research dataset

The critical point, stated explicitly in `sign-recognition-service/
DATASET.md` and the paper: **do not assume the training dataset or
trained model weights can be downloaded from a link.**

| Step | What to do | Why |
| --- | --- | --- |
| 1. Confirm access policy | Read the "Data Availability" / "Availability of data and materials" statement in the DOI article, and check the repository record's licensing (e.g. CC BY vs restricted thesis). | Most EthSL raw video is held for participant privacy / institutional protection. |
| 2. Identify the right contact | Use the paper's **Author Contributions** and **Acknowledgment** sections (and the corresponding author's institutional profile) to get the correct email. | Emails on the PDF's cover page / crossref record are the only valid request channel. |
| 3. Ask for the dataset or derived landmarks | Write a short, license-respecting email asking to (a) be granted access to the data if an embargo has lifted, or (b) receive the **derived landmark/features** (e.g. MediaPipe Holistic .npy) so the service's `app/preprocessing.py` contract can be matched. | In many projects the **landmarks** are the shareable artifact; the raw video is not. |
| 4. Verify licence before use | Confirm the terms explicitly cover your intended use (academic research vs commercial app feature). Signed consent for commercial deployment is usually **not** covered by the original research licence. | Commercial app use almost always needs separate participant consent. |
| 5. On success: ingest | Save videos/landmarks under `sign-recognition-service/data/raw/` (git-ignored), normalize with `app/preprocessing.py`, and re-run `training/split_by_signer.py` with the consent ids recorded. | Keeps the intake layout documented and GDPR/privacy-compliant. |

If **direct downloads fail**, follow the manual steps above: there is no
public mirror for the raw video or weights, so the request is made by
email to the paper's corresponding author using the DOI link, and the
response will land at whatever access level the authors permit.

---

## A note on theses and model weights

Neither the BDU thesis (`bdu-thesis-*.pdf`) nor the NADRE thesis
(`nadre-ethsl-alphabet-*.pdf`) contains its training dataset or trained
model weights. A thesis is a **report of a method and a corpus** — the
raw videos, the trained weights, and the consent records live elsewhere
(on BDU/University infrastructure) and must be requested separately.
Do not search these PDFs for a download link that does not exist.

---

## File map

| Resource | Type | License / access | Use here |
| --- | --- | --- | --- |
| `gonfa-2025-scientific-reports-ethsl.pdf` | Published paper (Sci. Reports) | CC BY 4.0 (open access); data restricted | Dataset strategy, evaluation protocol, landmark contract, paper DOI/contacts |
| `bdu-thesis-continuous-ethsl-2024.pdf` | BDU thesis | Restricted (institutional); full text may be on BDU repository | Stage 2 (continuous/CTC) reference = dataset B |
| `nadre-ethsl-alphabet-thesis-2021.pdf` | NADRE thesis record 2413 | Repository record; no direct link in this folder | Fingerspelling/vocabulary reference = dataset C |

## Where the data-strategy lives in the code

- `sign-recognition-service/DATASET.md` — full dataset strategy (datasets A/B/C, access checklist, consent rules, annotation rules, evaluation protocol).
- `sign-recognition-service/README.md` — run instructions, the `Predictor` interface, and data/model guidance.
- `sign-recognition-service/data/README.md` — the `data/` intake layout (templates only).
- `sign-recognition-service/training/split_by_signer.py` — signer-independent split (never split by clip).
- `sign-recognition-service/app/preprocessing.py` — the normalization contract the model must match.
- `sign-recognition-service/models/vocabulary.txt` — canonical gloss list (currently a template; glosses must be verified with EthSL users).
- `sign-recognition-service/tests/` — coverage of split and preprocessing guarantees.
