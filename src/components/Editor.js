import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
// import "codemirror/theme/dracula.css";
import "codemirror/mode/python/python";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/matchtags";
import "codemirror/addon/selection/active-line";
import "codemirror/mode/meta";
import "codemirror/theme/material.css";
import ACTIONS from "../Actions";
import "codemirror/theme/material.css";
import "codemirror/mode/clike/clike";

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const editorRef = useRef(null);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(45);
  const [input, setInput] = useState("");
  const [modalShow, setModalShow] = useState(false);
  const [modalBody, setModalBody] = useState("");
  const handleShowModal = () => setModalShow(true);
  const handleCloseModal = () => setModalShow(false);
  useEffect(() => {
    async function fetchLanguages() {
      try {
        const response = await axios.get(
          "https://game-changers.vercel.app/judge/getlang"
        );
        setLanguages(response.data);
      } catch (error) {
        console.error("Error fetching languages:", error);
      }
    }
    fetchLanguages();
  }, []);
  const darkModeStyles = {
    backgroundColor: "#333",
    color: "#fff",

    // Add other dark mode styles here
  };
  useEffect(() => {
    async function init() {
      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: "python",
          theme: "material",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
          styleActiveLine: true,
          matchBrackets: true,
          matchTags: true,
          lineWrapping: true,
          indentUnit: 4,
        }
      );

      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });
    }
    init();
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
    }

    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  }, [socketRef.current]);

  function saveFile() {
    // your CodeMirror textarea ID

    var textToWrite = editorRef.current.getValue();

    // preserving line breaks
    var textToWrite = textToWrite.replace(/\n/g, "\r\n");

    var textFileAsBlob = new Blob([textToWrite], { type: "text/plain" });
    var fileName = document.getElementById("filename").value;
    // filename to save as
    var fileNameToSaveAs = fileName;

    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;

    // hidden link title name
    downloadLink.innerHTML = "LINKTITLE";

    window.URL = window.URL || window.webkitURL;

    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);

    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
  }

  function destroyClickedElement(event) {
    document.body.removeChild(event.target);
  }

  const handleFileUpload = (event) => {
    const fileInput = event.target;
    const selectedFile = fileInput.files[0];

    if (selectedFile) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const fileContent = e.target.result;
        editorRef.current.setValue(fileContent); // Set the file content in CodeMirror
      };

      reader.readAsText(selectedFile);
    }
    insertText(" ");
    triggerButtonClick("Enter");
  };

  const insertText = (text) => {
    if (editorRef.current) {
      editorRef.current.replaceSelection(text);
    }
  };
  function triggerButtonClick(buttonId) {
    const button = document.getElementById(buttonId);

    if (button) {
      button.click(); // Simulate a button click
    } else {
      console.error(`Button with ID "${buttonId}" not found.`);
    }
  }
  const executeCode = async () => {
    try {
      const code = editorRef.current.getValue();
      const languageId = selectedLanguage; // Assuming selectedLanguage is the ID of the selected language
      const input = document.getElementById("inputArea").value;
      const response = await fetch(
        "https://game-changers.vercel.app/judge/execute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, languageId, input }),
        }
      );
      const resData = await response.json();
      // console.log(atob(resData.output.stdout));
      console.log(resData.output);
      let output = "";
      if (resData.output.stderr) {
        // If stderr is present, display the error message
        output = atob(resData.output.stderr);
      } else if (resData.output.stdout) {
        // Otherwise, display the standard output
        output = atob(resData.output.stdout);
      } else {
        output = resData.output.status.description;
      }
      document.getElementById("outputArea").value = output;
    } catch (error) {
      console.error("Error executing code:", error);
    }
  };
  return (
    <div>
      <div
        style={{
          height: "calc(100vh - 60px)", // Adjusted height
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <input
            style={{ marginTop: "10px", marginBottom: "10px" }}
            type="file"
            id="fileInput"
            className="inputBox"
            onChange={handleFileUpload}
            accept=".js, .txt, .html, .java, .cpp, .c, .py" // Specify the allowed file types
          />
        </div>
        {/* <div className="CodeMirror ">
        <textarea id="realtimeEditor"></textarea>
      </div> */}
        <div className="CodeMirror" style={{}}>
          <textarea id="realtimeEditor"></textarea>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-evenly",
            marginTop: "10px",
          }}
        >
          <select
            id="languageSelect"
            className="inputBox"
            style={{
              marginRight: "10px",
              flex: "none",
              width: "150px",
              marginTop: "10px",
            }}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
            }}
          >
            {languages.map((language) => (
              <option key={language.id} value={language.id}>
                {language.name}
              </option>
            ))}
          </select>
          <textarea
            id="inputArea"
            className="inputBox"
            placeholder="Enter input"
            style={{ resize: "none", marginRight: "10px", flex: "1" }} // Added style to disable resizing and set flex to "1"
          ></textarea>
          <button
            className="btn"
            style={{ flex: "none", alignSelf: "flex-start", marginTop: "10px" }}
            onClick={executeCode}
          >
            Run Code
          </button>{" "}
          {/* Added style to prevent button from expanding */}
        </div>
        <div>
          <textarea
            id="outputArea"
            className="inputBox"
            placeholder="Obtained Output"
            style={{ resize: "none", marginRight: "10px", flex: "1" }} // Added style to disable resizing and set flex to "1"
            readOnly
          ></textarea>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <input
            id="filename"
            type="text"
            className="inputBox"
            placeholder="Specify a filename"
          />
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-evenly",
              marginBottom: "10px",
            }}
          >
            <button className="btn" onClick={saveFile}>
              Save File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
