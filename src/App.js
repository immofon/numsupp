import TextField from '@material-ui/core/TextField'
import Box from '@material-ui/core/Box'
import CloseIcon from '@material-ui/icons/Close';
import { Button, IconButton, Paper, Toolbar, Typography, AppBar, Menu, MenuItem } from '@material-ui/core';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'
import Tex from '@matejmazur/react-katex'
import math from 'remark-math'
import 'katex/dist/katex.min.css' // `react-katex` does not import the CSS for you


import * as monaco from 'monaco-editor'

const httpprefix = "http://mofon.top:8179"

let log = ""
let editorCacheCode = ""
let editorCachePosition = new monaco.Position(1, 1)

const testdate = `# 1.矩阵相乘

## 题目描述
$m$行$n$列的矩阵$A$与$n$行$k$列的矩阵B的乘积$C=AB$为$m$行$k$列的矩阵，且有

$$
C_{ij}=\\sum_{l=1}^nA_{il}B_{lj}
$$
编写矩阵相乘的通用程序，并对于
$$
A=
\\left(
\\begin{matrix}
1&3&-2\\\\
-2&0&5
\\end{matrix}
\\right)
，
B=
\\left(
\\begin{matrix}
4&3\\\\
1&-2\\\\
0&8
\\end{matrix}
\\right)
$$
利用此通用程序计算乘积矩阵$C=AB$.


`

function App() {
  let line_num = 1
  const [codes, setCodes] = useState([])
  const [expectpointsNum, setExpectpointsNum] = useState(0)

  const [title, setTitle] = useState("正在加载题目列表")
  const [expectpointsInput, setExpectpointsInput] = useState({})
  const [running, setRunning] = useState(false)
  const [showConsole, setShowConsole] = useState(true)
  const [now, setNow] = useState(0)
  const [selectedCheckpoint, setSelectedCheckpoint] = useState("")
  const consoleEndRef = useRef(null)

  const [problems, setProblems] = useState([])
  const [problemName, setProblemName] = useState("")
  const [problemAnchorEl, setProblemAnchorEl] = useState(null);

  const [editor, setEditor] = useState(null)


  useEffect(() => {
    let ed = monaco.editor.create(document.getElementById("editor"), {
      value: "",
      language: "c"
    });
    ed.onDidChangeModelContent((e) => {
      const v = ed.getValue()
      const p = ed.getPosition()
      console.log(ed.getPosition())
      if (checkCode(v) === false) {
        ed.setValue(editorCacheCode)
        ed.setPosition(editorCachePosition)
        print("您只能按照要求更改代码,刚才的输入已被自动撤回")
      } else {
        editorCacheCode = v
        editorCachePosition = p
      }
    });
    setEditor(ed)
  }, [])

  const checkCode = (code) => {
    return code.split("\n").every(v => v.startsWith("/") || v === "")
    //return true
  }

  useEffect(() => {
    const code = "// hello"
    if (checkCode(code) === false) {
      alert("该题目有错误")
      return
    }

    editor && editor.setValue(code)
  }, [editor])


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

    printload_start("问题:" + problemName)
    fetch(`${httpprefix}/problem/${problemName}`, {
      method: "GET",
      mode: 'cors',
    }).then(response => response.json()).then(json => {
      console.log(json)
      setCodes(json.lines)
      setExpectpointsNum(json.expectpointsNum)
      printload_done("问题:" + problemName)
    }).catch(err => {
      print("访问服务器失败")
    }).finally(() => {
      setRunning(false)
      print("--------", false)
    })
  }, [problemName])

  const scrollConsoleToBottom = () => {
    setTimeout(() => consoleEndRef || consoleEndRef.current.scrollIntoView({ behavior: "smooth" }), 5)

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

  const run = () => {
    setShowConsole(true); print(testdate)

    let ok = true
    for (let i = 1; i <= expectpointsNum; i++) {
      let ep = expectpointsInput[`${i}`]
      if (typeof (ep) !== "string" || ep === "") {
        print(`请补全输入[${i}]`)
        ok = false
      }
    }
    if (!ok) {
      printbr()
      return
    }

    console.log(JSON.stringify(expectpointsInput))
    if (running === true) {
      print("服务器已经在运行您的程序,请等待...")
      return
    }
    setRunning(true)
    print("提交代码到服务器,开始运行")
    fetch(`${httpprefix}/run/${encodeURI(problemName)}`, {
      method: "POST",
      mode: 'cors',
      body: JSON.stringify(expectpointsInput)
    }).then(response => response.json()).then(json => {
      print(json.output)
    }).catch(err => {
      print("访问服务器失败")
    }).finally(() => {
      setRunning(false)
      printbr()
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
    fetch(`${httpprefix}/run/${encodeURI(problemName)}`, {
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
      printbr()
    })
  }

  return (
    <div>
      <AppBar position="static" style={{ marginBottom: "3em" }}>
        <Toolbar>

          <Typography noWrap style={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <Button color="inherit" onClick={e => setProblemAnchorEl(e.currentTarget)}>选择题目</Button>
          <Button color="inherit" onClick={() => setShowConsole(!showConsole)}>控制台</Button>
        </Toolbar>

        <Menu
          id="long-menu"
          anchorEl={problemAnchorEl}
          keepMounted
          open={Boolean(problemAnchorEl)}
          onClose={() => setProblemAnchorEl(null)}
          PaperProps={{
            style: {
              maxHeight: "20em",
              width: '50em',
            },
          }}
        >
          {problems.map((p) => (
            <MenuItem key={p.name} selected={p.name === problemName} onClick={() => { setProblemName(p.name); setTitle(p.name); setProblemAnchorEl(null) }}>
              {p.name}
            </MenuItem>
          ))}
        </Menu>
      </AppBar>



      <Box style={{ maxWidth: "50em", margin: "0 auto" }}>
        <div id="editor" style={{ height: "30em" }}></div>

        <div class="tex">
          
          <ReactMarkdown plugins={[math]}
            renderers={{
              inlineMath: ({ value }) => <Tex math={value} />,
              math: ({ value }) => <Tex block math={value} />
            }}>
            {testdate}
          </ReactMarkdown>
        </div>
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
                    spellCheck={false}
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
