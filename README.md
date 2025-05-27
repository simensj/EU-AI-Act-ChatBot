# EU-AI-Act-ChatBot

This project is licensed for non-commercial use only. For commercial use, please contact us.  
This is a bachelor thesis project developed by Simen Johannessen and Henrik Hoset.

This ChatBot is developed to answer general questions about the EU AI Act, in Norwegian.

If you want to host this on your own or further develop this project, the requirements and instructions are as follows:  
(Taken from the thesis report chapter 4)

- Python 3.12.
- Install the required libraries:
  - Open a terminal in the project root directory and run:
    ```
    pip install -r requirements.txt
    ```
    or you can run `install_dependencies.bat` on Windows systems.
  - On Linux you may be required or prefer to set up a virtual environment.  
    Follow this guide: https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/
- Set your OpenAI API key in `backend/constants.py`
- Set your LangSmith API key in `backend/constants.py`  
  - LangSmith tracing is not required and can be turned off by not following this step.  
    Additionally `backend/main.py` line 22–26 can be deleted if preferred.  
  - For further developments, LangSmith is recommended.  
    Set up your LangSmith project at https://smith.langchain.com and fill out `backend/main.py` line 22–26 with the necessary information.

There are several ways to run the chatbot, either on a Windows system or Linux-based system:

- For Windows systems, run the provided `.bat` file `start_chatbot`  
  - This starts the server and automatically opens up the web-app at `http://localhost:8000` in your default web browser.
- For Windows or Linux-based systems, open a terminal in the project root directory and run:
  - This starts the server, but does not automatically open the web-app. Access it with the URL: `http://localhost:8000`.
