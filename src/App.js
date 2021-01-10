import TextField from '@material-ui/core/TextField'
import Box from '@material-ui/core/Box'
import Chip from '@material-ui/core/Chip'
import CloseIcon from '@material-ui/icons/Close';
import DeleteForeverOutlinedIcon from '@material-ui/icons/DeleteForeverOutlined';
import codes from "./data/codes.json"
import { Button, IconButton, Paper, CircularProgress, Card, CardContent } from '@material-ui/core';
import { useState, useRef } from 'react';


let log = ""

function App() {
  let line_num = 1
  const [expectpointsInput, setExpectpointsInput] = useState({})
  const [running, setRunning] = useState(false)
  const [showConsole, setShowConsole] = useState(true)
  const [now, setNow] = useState(0)
  const [selectedCheckpoint, setSelectedCheckpoint] = useState("")
  const consoleEndRef = useRef(null)

  const scrollConsoleToBottom = () => {
    setTimeout(() => consoleEndRef.current.scrollIntoView({ behavior: "smooth" }), 5)

  }

  const update = () => setNow(Date.now())

  const clear = () => {
    log = ""
    update()
  }
  const print = (msg, show_time = true) => {

    if (show_time) {
      let now = new Date()
      const format = n => {
        if (n < 10) {
          return `0${n}`
        }
        return `${n}`
      }
      log = log + `\n${format(now.getHours())}:${format(now.getMinutes())}:${format(now.getSeconds())} ` + msg
    } else {
      log = log + "\n" + msg
    }
    scrollConsoleToBottom()
    update()
  }

  const run = () => {
    setShowConsole(true)
    console.log(JSON.stringify(expectpointsInput))
    if (running === true) {
      print("服务器已经在运行您的程序,请等待...")
      return
    }
    setRunning(true)
    print("提交代码到服务器,开始运行")
    fetch("http://localhost:8170/", {
      method: "POST",
      mode: 'cors',
      body: JSON.stringify(expectpointsInput)
    }).then(response => response.json()).then(json => {
      console.log(json)
      print(json.output)
    }).catch(err => {
      print("访问服务器失败")
    }).finally(() => {
      setRunning(false)
      print("--------", false)
    })
  }

  const runSelectedCheckpoint = () => {
    if (selectedCheckpoint === "") {
      return
    }
    setShowConsole(true)
    if (!expectpointsInput[selectedCheckpoint]) {
      print(`请补全输入[${selectedCheckpoint}]`)
      return
    }
    console.log(JSON.stringify(expectpointsInput))
    if (running === true) {
      print("服务器已经在运行您的程序,请等待...")
      return
    }
    setRunning(true)
    print(`提交代码到服务器,开始检查输入[${selectedCheckpoint}]`)
    fetch("http://localhost:8170/", {
      method: "POST",
      mode: 'cors',
      body: JSON.stringify({ [selectedCheckpoint]: expectpointsInput[selectedCheckpoint] })
    }).then(response => response.json()).then(json => {
      console.log(json)
      print(json.output)
    }).catch(err => {
      print("访问服务器失败")
    }).finally(() => {
      setRunning(false)
      print("--------", false)
    })
  }

  return (
    <div>


      <Box style={{ maxWidth: "50em", margin: "0 auto" }}>
        <Box style={{ position: "fixed", left: "3em", bottom: "3em" }}>

        <Button onClick={() => setShowConsole(true)} color="primary" variant="contained" >
            打开控制台
        </Button>
          
        
        </Box>

        
        <Button onClick={() => setShowConsole(true)} color="primary" variant="contained" style={{display:"block",marginTop:"1em"}} >
          选择题目
        </Button>
        {
          codes.map(x => {
            switch (x.type) {
              case "code":
                return (<div key={`code-${x.line}`}>
                  <span style={{ width: "", paddingRight: "1em", fontSize: 12, color: "gray", fontFamily: "monospace" }}>{line_num++}</span>
                  <pre style={{ fontFamily: "monospace", margin: 0, display: "inline" }}>{x.code.replace("\t", "  ")}</pre>
                </div>
                )
              case "checkpoint":
                return (<div key={`checkpoint-${x.line}`}>
                  <span style={{ width: "", paddingRight: "1em", fontSize: 12, color: "gray", fontFamily: "monospace" }}>{line_num++}</span>
                  <pre style={{ fontFamily: "monospace", margin: 0, display: "inline" }}>{"\t".replace("\t", "  ")}</pre>
                  <pre style={{ fontFamily: "monospace", margin: 0, display: "inline", color: "#cb3a56" }}>{`检查点[${x.id}] 检查${x.prompt}`}</pre>
                </div>)
              case "expectpoint":
                return (<div key={`expectpoint-${x.line}`} style={{ marginLeft: "3.5em", marginRight: "3em", fontFamily: "monospace", fontSize: 12 }}>
                  <TextField
                    id={`expectpoint-${x.id}`}
                    label={`输入[${x.id}] ${x.prompt}`}
                    multiline
                    size="small"
                    variant="standard"
                    style={{ width: "100%", marginTop: "0" }}
                    onFocus={e => { setSelectedCheckpoint(x.id) }}
                    onChange={e => {
                      const value = e.target.value
                      setExpectpointsInput({ ...expectpointsInput, [`${x.id}`]: value })
                    }}
                  />
                </div>

                )
            }
          })
        }
      </Box>

      <Box display="block" height="18em"></Box>
      <div>

        <Paper
          variant="outlined" square
          style={{
            display: (showConsole === true ? "" : "none"),
            width: "100%",
            position: "fixed", bottom: "0",
            zIndex: "100",
          }}>
          <IconButton
            onClick={() => setShowConsole(false)}
            size="small" color="primary" aria-label="close" component="span" style={{ position: "absolute", right: "1em", top: "0" }}>
            <CloseIcon style={{ fontSize: 19 }} />
          </IconButton>
          <div style={{ position: "absolute", left: "1em", top: "0" }}>
            <Button size="small" color="primary" onClick={() => setShowConsole(false)}>隐藏控制台</Button>
            <Button size="small" color="primary" onClick={clear}>清空输出</Button>
            <Button size="small" color="primary" onClick={() => { clear(); run() }}> 清空输出并运行</Button>
            <Button size="small" color="primary" onClick={run}> 运行</Button>

            <Button size="small" color="primary" onClick={runSelectedCheckpoint} style={{ display: selectedCheckpoint === "" ? "none" : "" }}> 检查输入[{selectedCheckpoint}]</Button>
          </div>

          <div style={{ margin: "1em", marginTop: "1.5em", height: "15em", overflowX: "auto" }}>
            {
              log.split("\n").map(v => {
                return (<pre style={{ fontSize: 12, margin: "0" }}>{v}</pre>)
              })
            }
            <div ref={consoleEndRef} />
          </div>
        </Paper>
      </div>

      <div style={{ display: "none" }}>{now}</div>
    </div>
  );
}

export default App;
