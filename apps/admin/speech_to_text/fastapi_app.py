from fastapi import FastAPI,File,UploadFile,HTTPException
from typing import List
from fastapi.responses import JSONResponse,RedirectResponse
import whisper
import torch
from tempfile import NamedTemporaryFile

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"  #DEVICE = "cpu"
model=whisper.load_model("small", device=DEVICE)

app = FastAPI()

@app.post("/whisper_transcribe")
async def transcribe_audio(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    transcriptions = []
    for file in files:
        if not file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail=f"Invalid file type: {file.content_type}. Only audio files are supported.")
        
        with NamedTemporaryFile(delete=True) as temp:
            with open(temp.name, "wb") as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_file.flush()
            result = model.transcribe(temp.name)
            transcriptions.append({"filename": file.filename, "transcription": result["text"]})
    return JSONResponse(content={"transcriptions": transcriptions}) 

@app.get("/")
async def redirect_to_docs():
    return RedirectResponse(url="/docs")