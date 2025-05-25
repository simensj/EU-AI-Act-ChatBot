'''
This script is based off snippets from https://python.langchain.com/docs/how_to/recursive_text_splitter/ and https://python.langchain.com/docs/tutorials/rag/
'''
import json
from langchain.text_splitter import RecursiveCharacterTextSplitter
from PyPDF2 import PdfReader

# Load PDF and extract text along with page numbers
def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = []
    page_numbers = []
    for page_number, page in enumerate(reader.pages, start=1):
        text.append(page.extract_text())
        page_numbers.append(page_number)
    return text, page_numbers

# Preprocess text to handle ".\n"
def preprocess_text(text):
    # Replace "\r\n" with "\n" for consistency
    text = text.replace("\r\n", "\n")
    # Replace ".\n" with a unique marker
    text = text.replace(".\n", ".<<DOT_NEWLINE>>") # In the final solution, this does not achieve anything, but earlier experiments had use for this. This was also used for debugging splits in earlier versions.
    return text

# Load the document
pdf_path = r"euACTnbcleaned-super.pdf" 
document_texts, page_numbers = extract_text_from_pdf(pdf_path)

# Preprocess the text for each page
preprocessed_texts = [preprocess_text(text) for text in document_texts]

# Combine text and page numbers into a single list of tuples
text_with_pages = list(zip(preprocessed_texts, page_numbers))

# Configure LangChain text splitter with custom separators
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,  
    chunk_overlap=200,  
    separators=[".", " ", ""],
    length_function=len
)

# Generate chunks with page numbers
chunks = []
for text, page_number in text_with_pages:
    split_chunks = splitter.split_text(text)
    for chunk in split_chunks:
        chunks.append({"text": chunk, "page": page_number})

# Structure chunks into JSON with page numbers
json_chunks = [{"id": idx, "text": chunk["text"], "page": chunk["page"]} for idx, chunk in enumerate(chunks)]

# Save to JSON file with proper encoding (ensure_ascii=False)
output_file = "Recursive_Chunks_sw"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(json_chunks, f, ensure_ascii=False, indent=4)

print(f"Chunked document saved to {output_file}")
