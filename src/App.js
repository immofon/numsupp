import { Button, Dialog,DialogTitle,DialogContent, DialogActions,TextField, Toolbar, Typography, AppBar, Menu, MenuItem, Grid } from '@material-ui/core';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'
import Tex from '@matejmazur/react-katex'
import math from 'remark-math'
import gfm from 'remark-gfm'
import 'katex/dist/katex.min.css' // `react-katex` does not import the CSS for you

import * as monaco from 'monaco-editor'

const httpprefix = "http://mofon.top:8179"

let log = ""
let editorCacheCode = ""
let editorCachePosition = new monaco.Position(1, 1)



function App() {
  const [markdown, setMarkdown] = useState("")
  const [splitedCode, setSplitedCode] = useState([])

  const [username, setUsername] = useState((window.localStorage && window.localStorage.getItem("numsupp_username")) || "")
  const [openLoginDialog, setOpenLoginDialog] = useState(false)
  
  const [expectpointsNum, setExpectpointsNum] = useState(0)

  const [title, setTitle] = useState("正在加载题目列表")
  const [expectpointsInput, setExpectpointsInput] = useState({})
  const [running, setRunning] = useState(false)
  const [now, setNow] = useState(0)
  const [selectedCheckpoint, setSelectedCheckpoint] = useState("")
  const consoleEndRef = useRef(null)

  const [problems, setProblems] = useState([])
  const [problemName, setProblemName] = useState("")
  const [problemAnchorEl, setProblemAnchorEl] = useState(null);

  const [editor, setEditor] = useState(null)



  const getHeight = () => {
    const appbar = document.getElementById("appbar")
    return window.innerHeight - appbar.offsetHeight
  }

  const [height, setHeight] = useState(0)

  useEffect(() => {
    setHeight(getHeight())
    window.addEventListener("resize", e => {
      setHeight(getHeight())
    })
  }, [])

  const checkCode = () => {
    const splited = editor.getValue().replace(/\r/mg, "").split(/^\/\/>{30}\[[0-9]+\]<{30}\/\/\n/mg)
    if (splited.length !== splitedCode.length) {
      return false
    }
    for (let i = 0; i < splited.length; i += 2) {
      if (splited[i] !== splitedCode[i]) {
        return false
      }
    }
    return true
  }

  useEffect(() => {
    const imr = setInterval(() => {
      if (editor && typeof (editor.getValue()) === "string" && splitedCode.length > 0) {
        const v = editor.getValue()
        const p = editor.getPosition()
        if (checkCode() === false) {
          editor.setValue(editorCacheCode)
          editor.setPosition(editorCachePosition)
          print("您只能按照要求更改代码,刚才的操作已被自动撤回")
        } else {
          editorCacheCode = v
          editorCachePosition = p
        }
      }

    }, 100)
    return () => clearInterval(imr)
  }, [editor, splitedCode])

  useEffect(() => {
    let ed = monaco.editor.create(document.getElementById("editor"), {
      value: "",
      language: "c",
      automaticLayout: true,
      minimap: { enabled: false },
    });

    setEditor(ed)
  }, [])





  useEffect(() => {
    printload_start("题目列表")

    printload_start("问题:" + problemName)
    fetch(`${httpprefix}/problems`, {
      method: "GET",
      mode: 'cors',
    }).then(response => response.json()).then(json => {

      json = json.map(v => ({
        name: v,
      }))
      setProblems(json)
      setTitle("请选择题目")

      printload_done("题目列表")
    }).catch(err => {
      print("访问服务器失败")
    }).finally(() => {
      print("--------", false)
    })
  }, [])

  useEffect(() => {
    if (problemName === "") {
      return
    }

    setSplitedCode([])
    editorCacheCode = ""
    editorCachePosition = new monaco.Position(0, 0)

    printload_start("问题:" + problemName)
    fetch(`${httpprefix}/problem/${problemName}`, {
      method: "GET",
      mode: 'cors',
    }).then(response => response.json()).then(json => {
      console.log(json)
      let code = json.code || ""
      code = code.replace(/\r/mg, "")
      editor.setValue(code)
      editorCacheCode = code
      setSplitedCode(code.split(/^\/\/>{30}\[[0-9]+\]<{30}\/\/\n/mg))
      setMarkdown(json.markdown || "")
      setExpectpointsNum(json.expects || 0)
      printload_done("问题:" + problemName)
    }).catch(err => {
      print("访问服务器失败")
    }).finally(() => {
      setRunning(false)
      print("--------", false)
    })
  }, [problemName])

  const scrollConsoleToBottom = () => {
    setTimeout(() => consoleEndRef && consoleEndRef.current.scrollIntoView(false), 10)
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



  const printbr = () => print("--------", false)

  const printload_start = (msg) => {
    print("[正在加载] " + msg)
  }
  const printload_done = (msg) => {
    print("[加载成功] " + msg)
  }

  const getExpectCode = id => { // id: 1,2,...
    const splited = editor.getValue().replace(/\r/mg, "").split(/^\/\/>{30}\[[0-9]+\]<{30}\/\/\n/mg)
    return splited[id * 2 - 1]
  }

  const run = () => {
    let expects = []
    for (let i = 1; i <= expectpointsNum; i++) {
      expects.push(getExpectCode(i).replace(/\r/mg, ""))
    }

    if (running === true) {
      print("服务器已经在运行您的程序,请等待...")
      return
    }
    setRunning(true)
    print("提交代码到服务器,开始运行")
    fetch(`${httpprefix}/run/${encodeURI(problemName)}`, {
      method: "POST",
      mode: 'cors',
      body: JSON.stringify({
        expects: expects,
        username:username,
      })
    }).then(response => response.json()).then(json => {
      print(json.output)
    }).catch(err => {
      print("访问服务器失败")
    }).finally(() => {
      setRunning(false)
      printbr()
    })
  }

  const check = () => {
    let expects = []
    for (let i = 1; i <= expectpointsNum; i++) {
      expects.push(getExpectCode(i).replace(/\r/mg, ""))
    }

    if (running === true) {
      print("服务器已经在检查您的输入,请等待...")
      return
    }
    setRunning(true)
    print("提交代码到服务器,开始检查")
    fetch(`${httpprefix}/check/${encodeURI(problemName)}`, {
      method: "POST",
      mode: 'cors',
      body: JSON.stringify({
        expects: expects,
        username:username,
      })
    }).then(response => response.json()).then(json => {
      print(json.output)
    }).catch(err => {
      print("访问服务器失败")
    }).finally(() => {
      setRunning(false)
      printbr()
    })
  }



  return (
    <div>

      <AppBar id="appbar" position="static" style={{ margin: "0rem" }} elevation={0}>
        <Toolbar variant="dense">
          <Typography noWrap style={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <Button color="inherit" onClick={()=>setOpenLoginDialog(true)}>{username === "" ? "登陆" : `您好,${username}`}</Button>
          <Button color="inherit" onClick={e => setProblemAnchorEl(e.currentTarget)}>选择题目</Button>
          <Button color="inherit" onClick={run}>运行</Button>
          <Button color="inherit" onClick={check}>检查输入</Button>
        </Toolbar>

        <Menu
          id="long-menu"
          anchorEl={problemAnchorEl}
          keepMounted
          open={Boolean(problemAnchorEl)}
          onClose={() => setProblemAnchorEl(null)}
          PaperProps={{
            style: {
              maxHeight: "30em"
            },
          }}
        >
          {problems.map((p) => (
            <MenuItem key={p.name} selected={p.name === problemName} onClick={() => { setProblemName(p.name); setTitle(p.name); setProblemAnchorEl(null) }}>
              {p.name}
            </MenuItem>
          ))}
        </Menu>

        <Dialog open={openLoginDialog} onClose={() => setOpenLoginDialog(false)} aria-labelledby="form-dialog-title">
          <DialogTitle id="form-dialog-title">请输入您的姓名</DialogTitle>
          <DialogContent>
            <TextField
              value={username}
              onChange={e => { setUsername(e.target.value); window.localStorage.setItem("numsupp_username", e.target.value) }}
              autoFocus
              margin="dense"
              id="name"
              label="姓名"
              type="text"
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenLoginDialog(false)} color="primary">
              确定
          </Button>
          </DialogActions>
        </Dialog>
      </AppBar>


      <Grid
        container
        direction="row"
        alignItems="stretch"
        style={{ width: "100%", height: "100%" }}
      >
        <Grid item xs={6}>
          <div style={{ overflowY: "auto", height: height * 0.7, margin: "0" }}>
            <div style={{ margin: "0.5rem" }}>
              <ReactMarkdown plugins={[math, gfm]}
                renderers={{
                  inlineMath: ({ value }) => <Tex math={value} />,
                  math: ({ value }) => <Tex block math={value} />
                }}>
                {markdown}
              </ReactMarkdown>
            </div>
          </div>



          <div style={{ overflowY: "auto", height: height * 0.3, width: "100%", margin: "0", borderTop: "1px solid #bbb" }}>
            <div style={{ margin: "0.5rem" }}>
              {
                log.split("\n").map(v => {
                  return (<div style={{ fontSize: 12, margin: "0" }}>{v}</div>)
                })
              }


            </div>
            <div ref={consoleEndRef}></div>
          </div>

        </Grid>
        <Grid item xs={6}>
          <div id="editor" style={{ height: "100%", overflow: "hidden", borderLeft: "1px solid #bbb" }}></div>
        </Grid>
      </Grid>








      {/*

      
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
        
      */}

      <div style={{ display: "none" }}>{now}</div>
    </div>
  );
}

export default App;
