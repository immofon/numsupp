import TextField from '@material-ui/core/TextField'
import Box from '@material-ui/core/Box'
import Chip from '@material-ui/core/Chip'
import CloseIcon from '@material-ui/icons/Close';
import DeleteForeverOutlinedIcon from '@material-ui/icons/DeleteForeverOutlined';
import codes from "./data/codes.json"
import { Button,IconButton, Paper, CircularProgress, Card, CardContent } from '@material-ui/core';
import { useState,useRef } from 'react';


let log = ""

function App() {
  let line_num = 1
  const [expectpointsInput, setExpectpointsInput] = useState({})
  const [running, setRunning] = useState(false)
  const [showConsole, setShowConsole] = useState(true)
  const [now, setNow] = useState(0)
  const consoleEndRef = useRef(null)

  const scrollConsoleToBottom = () => {
    consoleEndRef.current.scrollIntoView({ behavior: "smooth" })
  }

  const update = () => setNow(Date.now())

  const clear = () => {
    log = ""
    update()
  }
  const print = (msg,show_time=true) => {
    let now = new Date()
    const format = n => {
      if (n < 10) {
        return `0${n}`
      }
      return `${n}`
    }
    if (show_time) {
      log = log + `\n${format(now.getHours())}:${format(now.getMinutes())}:${format(now.getSeconds())} ` + msg
    } else {
      log = log + "\n" + msg
    }
    update()
    scrollConsoleToBottom()
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
    fetch("http://localhost:8170", {
      method: "POST",
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify()
    }).then(response => response.json()).then(json => {
      console.log(json)
    }).catch(err => {
      print("运行失败")
    }).finally(() => {
      setRunning(false)
    })
  }

  return (
    <div>
      
      
      <Box style={{ maxWidth: "50em", margin: "0 auto" }}>
        <Button onClick={()=>setShowConsole(true)} color="primary" variant="outlined" style={{ position: "fixed", left: "3em", bottom: "3em" }}>
          打开控制台
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
          onClick={()=>setShowConsole(false)}
          size="small" color="primary" aria-label="close" component="span" style={{ position: "absolute", right: "1em", top: "0" }}>
          <CloseIcon style={{fontSize:19}}/>
          </IconButton>
          <div style={{ position: "absolute", left: "1em", top: "0" }}>
            <Button size="small" color="primary" onClick={()=>setShowConsole(false)}>隐藏控制台</Button>
            <Button size="small" color="primary" onClick={clear}>清空输出</Button>
            <Button size="small" color="primary" onClick={run}> 运行</Button>
          </div>
          
          <div style={{ margin: "1em",marginTop:"1.5em", height: "15em", overflowX: "auto" }}>
          {
            log.split("\n").map(v => {
              return (<pre style={{fontSize:12, margin:"0"}}>{v}</pre>)
            })
            }
            <div  ref={consoleEndRef}/>
          </div>
      </Paper>
      </div>
      
      <div style={{display:"none"}}>{ now }</div>
    </div>
  );
}

export default App;
