window.BENCHMARK_DATA = {
  "lastUpdate": 1794785754841,
  "repoUrl": "https://github.com/ZhangDanyang-AMD/ATOM",
  "entries": {
    "Benchmark": [
      {
        "commit": {
          "author": {
            "email": "Yifeng.Huang@amd.com",
            "name": "yifehuan-amd",
            "username": "yifehuan"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "79149c7f10c0a58fce13997fcece3e1bd123bd27",
          "message": "[DSV4.1][gfx1250] single launch: no IR value in module state while the step kernel traces (#3279)\n\n* [DSV4.1][gfx1250] single launch: no IR value in module state while the step kernel traces\n\nThe step kernel kept two trace-time values at module level: the poll-timeout counter's\npointer (device.TOFLAG, set from the kernel's `cyc` argument when the body starts tracing and\ncleared at its end) and a stamp hook (stamps.HOOK, never set on main). An IR value lives in the\nMLIRContext of the trace that made it; at module level it is visible to any other trace in the\nprocess. Two traces of the step kernel at once (several ranks' or widths' builds on threads)\nthen use one trace's value in the other's context and fail:\n\n    'llvm.inttoptr' op operand #0 type from a different MLIRContext than this operation\n    'llvm.load' op operation destroyed but still has uses (LLVM ERROR, aborts the process)\n\nMeasured with 4 ranks' target kernels traced on 4 threads, compile-only, gfx1250: main fails\nunder FlyDSL 0.4.1 (3 of 4 ranks) and under 0.5.0 (3 of 4, or the LLVM abort); traced one at a\ntime both pass. FlyDSL 0.5 traces on every compile / JIT call before its IR-keyed cache lookup\nand keeps its own compile state thread-local, so concurrent traces must not share module state.\n\nRemove the module-level slots and what used them: the timeout counter (note_timeout, TOFLAG and\nthe runner's read-back of `cyc`) and the stamp hook (stamps.py and its points in topk / moe).\nEvery poll stays bounded (POLL_TICKS); the kernels now hold no IR value outside a trace. With\nthe change the same 4-thread build passes under 0.4.1 and 0.5.0. The step's launches already go\nthrough flyc.compile's CompiledFunction after the first (as #3226 does for the other mono\nprograms), so no launcher retraces per call.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n\n* [DSV4.1][gfx1250] single launch: drop the dead timeout site ids\n\nWith note_timeout gone nothing reads the site id the bounded waits carried: drop the\nparameter from wait_count / handoff / poll_unit and their call sites (markov, step, moe).\nA poll still gives up after POLL_TICKS and goes on with what it read.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n\n* [DSV4.1][gfx1250] single launch: keep the poll-timeout counter, held per trace\n\nReview: keep the poll-timeout signal rather than deleting it. Restore the counter (the\nstep kernel's 'cyc' scratch: int32 [0] count, [1] last site id), its site ids at every\nbounded poll and the runner's read-back that logs a timeout. Its pointer is an IR value of\nthe trace that loaded it, so it is no longer module state: device.timeout_counter holds it\nper thread for the trace that set it (the step body sets it from its own 'cyc' argument\nand clears it at its end). FlyDSL traces a kernel on the calling thread with thread-local\ncompile state, so concurrent traces never see each other's pointer; passing it as an\nargument would touch every handoff / poll call site (~40).\n\ntests: four ranks' target kernels traced at once on four threads, compile-only (ARCH,\nno GPU), each with its own counter. Standalone, gfx1250 images: this head passes under\nFlyDSL 0.5.0 and 0.4.1 (each thread sees its own counter); main fails under 0.5.0 (3 of 4\nranks: 'llvm.inttoptr' operand from a different MLIRContext) and aborts under 0.4.1\n('operation destroyed but still has uses').\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n\n---------\n\nCo-authored-by: Claude Opus 5.5 <noreply@anthropic.com>",
          "timestamp": "2026-11-14T16:09:04+08:00",
          "tree_id": "aa251c544400c71c12d96326c6479eb289cbe888",
          "url": "https://github.com/ZhangDanyang-AMD/ATOM/commit/79149c7f10c0a58fce13997fcece3e1bd123bd27"
        },
        "date": 1794649922588,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 request throughput",
            "value": 2338.17,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=420871 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 avg latency",
            "value": 0.41,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=420871 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 p99 latency",
            "value": 0.47,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=420871 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 p999 latency",
            "value": 0.61,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=420871 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=420871 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 request throughput",
            "value": 7118.27,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1281289 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 avg latency",
            "value": 2.2,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1281289 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 p99 latency",
            "value": 3.71,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1281289 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 p999 latency",
            "value": 4.73,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1281289 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1281289 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 request throughput",
            "value": 3898.66,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=701758 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 avg latency",
            "value": 0.48,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=701758 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 p99 latency",
            "value": 0.63,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=701758 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 p999 latency",
            "value": 0.81,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=701758 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=701758 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 request throughput",
            "value": 5865.99,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1055879 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 avg latency",
            "value": 0.65,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1055879 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 p99 latency",
            "value": 1.04,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1055879 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 p999 latency",
            "value": 1.43,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1055879 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1055879 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 request throughput",
            "value": 6921.18,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1245812 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 avg latency",
            "value": 1.11,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1245812 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 p99 latency",
            "value": 1.94,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1245812 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 p999 latency",
            "value": 2.54,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1245812 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1245812 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 request throughput",
            "value": 2316.97,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=417055 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 avg latency",
            "value": 0.41,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=417055 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 p99 latency",
            "value": 0.47,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=417055 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 p999 latency",
            "value": 0.61,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=417055 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=417055 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 request throughput",
            "value": 7298.97,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1313814 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 avg latency",
            "value": 2.15,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1313814 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 p99 latency",
            "value": 3.64,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1313814 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 p999 latency",
            "value": 4.56,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1313814 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1313814 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 request throughput",
            "value": 3869.95,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=696591 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 avg latency",
            "value": 0.49,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=696591 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 p99 latency",
            "value": 0.63,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=696591 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 p999 latency",
            "value": 0.78,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=696591 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=696591 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 request throughput",
            "value": 5880.56,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1058501 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 avg latency",
            "value": 0.65,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1058501 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 p99 latency",
            "value": 1.04,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1058501 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 p999 latency",
            "value": 1.41,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1058501 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1058501 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 request throughput",
            "value": 6804.18,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1224753 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 avg latency",
            "value": 1.13,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1224753 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 p99 latency",
            "value": 1.97,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1224753 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 p999 latency",
            "value": 2.57,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1224753 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1224753 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 request throughput",
            "value": 2321.24,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=417823 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 avg latency",
            "value": 0.41,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=417823 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 p99 latency",
            "value": 0.47,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=417823 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 p999 latency",
            "value": 0.54,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=417823 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=417823 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 request throughput",
            "value": 7035.13,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1266323 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 avg latency",
            "value": 2.23,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1266323 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 p99 latency",
            "value": 3.76,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1266323 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 p999 latency",
            "value": 4.75,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1266323 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1266323 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 request throughput",
            "value": 3892.17,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=700590 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 avg latency",
            "value": 0.49,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=700590 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 p99 latency",
            "value": 0.62,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=700590 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 p999 latency",
            "value": 0.77,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=700590 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=700590 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 request throughput",
            "value": 5895.91,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1061263 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 avg latency",
            "value": 0.64,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1061263 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 p99 latency",
            "value": 1.03,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1061263 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 p999 latency",
            "value": 1.42,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1061263 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1061263 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 request throughput",
            "value": 6897.15,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1241487 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 avg latency",
            "value": 1.12,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1241487 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 p99 latency",
            "value": 1.95,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1241487 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 p999 latency",
            "value": 2.53,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1241487 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1241487 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43577251270"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "yifehuan-amd",
            "username": "yifehuan",
            "email": "Yifeng.Huang@amd.com"
          },
          "committer": {
            "name": "GitHub",
            "username": "web-flow",
            "email": "noreply@github.com"
          },
          "id": "79149c7f10c0a58fce13997fcece3e1bd123bd27",
          "message": "[DSV4.1][gfx1250] single launch: no IR value in module state while the step kernel traces (#3279)\n\n* [DSV4.1][gfx1250] single launch: no IR value in module state while the step kernel traces\n\nThe step kernel kept two trace-time values at module level: the poll-timeout counter's\npointer (device.TOFLAG, set from the kernel's `cyc` argument when the body starts tracing and\ncleared at its end) and a stamp hook (stamps.HOOK, never set on main). An IR value lives in the\nMLIRContext of the trace that made it; at module level it is visible to any other trace in the\nprocess. Two traces of the step kernel at once (several ranks' or widths' builds on threads)\nthen use one trace's value in the other's context and fail:\n\n    'llvm.inttoptr' op operand #0 type from a different MLIRContext than this operation\n    'llvm.load' op operation destroyed but still has uses (LLVM ERROR, aborts the process)\n\nMeasured with 4 ranks' target kernels traced on 4 threads, compile-only, gfx1250: main fails\nunder FlyDSL 0.4.1 (3 of 4 ranks) and under 0.5.0 (3 of 4, or the LLVM abort); traced one at a\ntime both pass. FlyDSL 0.5 traces on every compile / JIT call before its IR-keyed cache lookup\nand keeps its own compile state thread-local, so concurrent traces must not share module state.\n\nRemove the module-level slots and what used them: the timeout counter (note_timeout, TOFLAG and\nthe runner's read-back of `cyc`) and the stamp hook (stamps.py and its points in topk / moe).\nEvery poll stays bounded (POLL_TICKS); the kernels now hold no IR value outside a trace. With\nthe change the same 4-thread build passes under 0.4.1 and 0.5.0. The step's launches already go\nthrough flyc.compile's CompiledFunction after the first (as #3226 does for the other mono\nprograms), so no launcher retraces per call.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n\n* [DSV4.1][gfx1250] single launch: drop the dead timeout site ids\n\nWith note_timeout gone nothing reads the site id the bounded waits carried: drop the\nparameter from wait_count / handoff / poll_unit and their call sites (markov, step, moe).\nA poll still gives up after POLL_TICKS and goes on with what it read.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n\n* [DSV4.1][gfx1250] single launch: keep the poll-timeout counter, held per trace\n\nReview: keep the poll-timeout signal rather than deleting it. Restore the counter (the\nstep kernel's 'cyc' scratch: int32 [0] count, [1] last site id), its site ids at every\nbounded poll and the runner's read-back that logs a timeout. Its pointer is an IR value of\nthe trace that loaded it, so it is no longer module state: device.timeout_counter holds it\nper thread for the trace that set it (the step body sets it from its own 'cyc' argument\nand clears it at its end). FlyDSL traces a kernel on the calling thread with thread-local\ncompile state, so concurrent traces never see each other's pointer; passing it as an\nargument would touch every handoff / poll call site (~40).\n\ntests: four ranks' target kernels traced at once on four threads, compile-only (ARCH,\nno GPU), each with its own counter. Standalone, gfx1250 images: this head passes under\nFlyDSL 0.5.0 and 0.4.1 (each thread sees its own counter); main fails under 0.5.0 (3 of 4\nranks: 'llvm.inttoptr' operand from a different MLIRContext) and aborts under 0.4.1\n('operation destroyed but still has uses').\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n\n---------\n\nCo-authored-by: Claude Opus 5.5 <noreply@anthropic.com>",
          "timestamp": "2026-11-14T08:09:04Z",
          "url": "https://github.com/ZhangDanyang-AMD/ATOM/commit/79149c7f10c0a58fce13997fcece3e1bd123bd27"
        },
        "date": 1794696997442,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 request throughput",
            "value": 2325.74,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418634 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 avg latency",
            "value": 0.41,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418634 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 p99 latency",
            "value": 0.47,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418634 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 p999 latency",
            "value": 0.62,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418634 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418634 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 request throughput",
            "value": 7183.23,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1292982 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 avg latency",
            "value": 2.18,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1292982 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 p99 latency",
            "value": 3.71,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1292982 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 p999 latency",
            "value": 4.68,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1292982 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1292982 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 request throughput",
            "value": 3856.29,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=694132 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 avg latency",
            "value": 0.49,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=694132 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 p99 latency",
            "value": 0.64,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=694132 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 p999 latency",
            "value": 0.84,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=694132 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=694132 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 request throughput",
            "value": 5806.96,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1045252 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 avg latency",
            "value": 0.65,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1045252 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 p99 latency",
            "value": 1.05,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1045252 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 p999 latency",
            "value": 1.45,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1045252 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1045252 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 request throughput",
            "value": 6922.85,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1246113 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 avg latency",
            "value": 1.11,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1246113 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 p99 latency",
            "value": 1.94,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1246113 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 p999 latency",
            "value": 2.56,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1246113 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1246113 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 request throughput",
            "value": 2327.37,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418926 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 avg latency",
            "value": 0.41,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418926 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 p99 latency",
            "value": 0.47,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418926 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 p999 latency",
            "value": 0.64,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418926 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418926 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 request throughput",
            "value": 7211.91,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1298144 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 avg latency",
            "value": 2.17,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1298144 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 p99 latency",
            "value": 3.68,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1298144 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 p999 latency",
            "value": 4.65,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1298144 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1298144 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 request throughput",
            "value": 3863.98,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=695516 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 avg latency",
            "value": 0.49,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=695516 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 p99 latency",
            "value": 0.63,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=695516 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 p999 latency",
            "value": 0.83,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=695516 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=695516 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 request throughput",
            "value": 5815.9,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1046862 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 avg latency",
            "value": 0.65,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1046862 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 p99 latency",
            "value": 1.05,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1046862 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 p999 latency",
            "value": 1.42,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1046862 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1046862 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 request throughput",
            "value": 6899.4,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1241892 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 avg latency",
            "value": 1.12,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1241892 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 p99 latency",
            "value": 1.95,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1241892 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 p999 latency",
            "value": 2.54,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1241892 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1241892 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 request throughput",
            "value": 2336.74,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=420613 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 avg latency",
            "value": 0.41,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=420613 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 p99 latency",
            "value": 0.46,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=420613 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 p999 latency",
            "value": 0.63,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=420613 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=420613 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 request throughput",
            "value": 7145.44,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1286180 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 avg latency",
            "value": 2.19,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1286180 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 p99 latency",
            "value": 3.72,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1286180 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 p999 latency",
            "value": 4.65,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1286180 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1286180 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 request throughput",
            "value": 3871.16,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=696809 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 avg latency",
            "value": 0.49,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=696809 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 p99 latency",
            "value": 0.63,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=696809 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 p999 latency",
            "value": 0.83,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=696809 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=696809 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 request throughput",
            "value": 5835.36,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1050365 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 avg latency",
            "value": 0.65,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1050365 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 p99 latency",
            "value": 1.05,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1050365 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 p999 latency",
            "value": 1.4,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1050365 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1050365 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 request throughput",
            "value": 6826.4,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1228752 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 avg latency",
            "value": 1.13,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1228752 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 p99 latency",
            "value": 1.97,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1228752 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 p999 latency",
            "value": 2.53,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1228752 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1228752 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43645507551"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "yifehuan-amd",
            "username": "yifehuan",
            "email": "Yifeng.Huang@amd.com"
          },
          "committer": {
            "name": "GitHub",
            "username": "web-flow",
            "email": "noreply@github.com"
          },
          "id": "79149c7f10c0a58fce13997fcece3e1bd123bd27",
          "message": "[DSV4.1][gfx1250] single launch: no IR value in module state while the step kernel traces (#3279)\n\n* [DSV4.1][gfx1250] single launch: no IR value in module state while the step kernel traces\n\nThe step kernel kept two trace-time values at module level: the poll-timeout counter's\npointer (device.TOFLAG, set from the kernel's `cyc` argument when the body starts tracing and\ncleared at its end) and a stamp hook (stamps.HOOK, never set on main). An IR value lives in the\nMLIRContext of the trace that made it; at module level it is visible to any other trace in the\nprocess. Two traces of the step kernel at once (several ranks' or widths' builds on threads)\nthen use one trace's value in the other's context and fail:\n\n    'llvm.inttoptr' op operand #0 type from a different MLIRContext than this operation\n    'llvm.load' op operation destroyed but still has uses (LLVM ERROR, aborts the process)\n\nMeasured with 4 ranks' target kernels traced on 4 threads, compile-only, gfx1250: main fails\nunder FlyDSL 0.4.1 (3 of 4 ranks) and under 0.5.0 (3 of 4, or the LLVM abort); traced one at a\ntime both pass. FlyDSL 0.5 traces on every compile / JIT call before its IR-keyed cache lookup\nand keeps its own compile state thread-local, so concurrent traces must not share module state.\n\nRemove the module-level slots and what used them: the timeout counter (note_timeout, TOFLAG and\nthe runner's read-back of `cyc`) and the stamp hook (stamps.py and its points in topk / moe).\nEvery poll stays bounded (POLL_TICKS); the kernels now hold no IR value outside a trace. With\nthe change the same 4-thread build passes under 0.4.1 and 0.5.0. The step's launches already go\nthrough flyc.compile's CompiledFunction after the first (as #3226 does for the other mono\nprograms), so no launcher retraces per call.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n\n* [DSV4.1][gfx1250] single launch: drop the dead timeout site ids\n\nWith note_timeout gone nothing reads the site id the bounded waits carried: drop the\nparameter from wait_count / handoff / poll_unit and their call sites (markov, step, moe).\nA poll still gives up after POLL_TICKS and goes on with what it read.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n\n* [DSV4.1][gfx1250] single launch: keep the poll-timeout counter, held per trace\n\nReview: keep the poll-timeout signal rather than deleting it. Restore the counter (the\nstep kernel's 'cyc' scratch: int32 [0] count, [1] last site id), its site ids at every\nbounded poll and the runner's read-back that logs a timeout. Its pointer is an IR value of\nthe trace that loaded it, so it is no longer module state: device.timeout_counter holds it\nper thread for the trace that set it (the step body sets it from its own 'cyc' argument\nand clears it at its end). FlyDSL traces a kernel on the calling thread with thread-local\ncompile state, so concurrent traces never see each other's pointer; passing it as an\nargument would touch every handoff / poll call site (~40).\n\ntests: four ranks' target kernels traced at once on four threads, compile-only (ARCH,\nno GPU), each with its own counter. Standalone, gfx1250 images: this head passes under\nFlyDSL 0.5.0 and 0.4.1 (each thread sees its own counter); main fails under 0.5.0 (3 of 4\nranks: 'llvm.inttoptr' operand from a different MLIRContext) and aborts under 0.4.1\n('operation destroyed but still has uses').\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\n\n---------\n\nCo-authored-by: Claude Opus 5.5 <noreply@anthropic.com>",
          "timestamp": "2026-11-14T08:09:04Z",
          "url": "https://github.com/ZhangDanyang-AMD/ATOM/commit/79149c7f10c0a58fce13997fcece3e1bd123bd27"
        },
        "date": 1794785754315,
        "tool": "customBiggerIsBetter",
        "benches": [
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 request throughput",
            "value": 2330.42,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=419476 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 avg latency",
            "value": 0.41,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=419476 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 p99 latency",
            "value": 0.46,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=419476 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 p999 latency",
            "value": 0.53,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=419476 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc1 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc1 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=419476 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 request throughput",
            "value": 7047.94,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1268630 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 avg latency",
            "value": 2.23,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1268630 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 p99 latency",
            "value": 3.74,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1268630 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 p999 latency",
            "value": 4.6,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1268630 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc16 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc16 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1268630 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 request throughput",
            "value": 3862.35,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=695223 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 avg latency",
            "value": 0.49,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=695223 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 p99 latency",
            "value": 0.63,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=695223 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 p999 latency",
            "value": 0.77,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=695223 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc2 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc2 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=695223 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 request throughput",
            "value": 5727.22,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1030899 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 avg latency",
            "value": 0.66,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1030899 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 p99 latency",
            "value": 1.06,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1030899 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 p999 latency",
            "value": 1.42,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1030899 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc4 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc4 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1030899 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 request throughput",
            "value": 6737.62,
            "unit": "req/s",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1212771 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 avg latency",
            "value": 1.15,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1212771 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 p99 latency",
            "value": 1.98,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1212771 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 p999 latency",
            "value": 2.56,
            "unit": "ms",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1212771 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-1p1d-conc8 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-1p1d-conc8 router=pd policy=round_robin workers=2 prefill=1 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1212771 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 request throughput",
            "value": 2325.32,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418558 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 avg latency",
            "value": 0.41,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418558 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 p99 latency",
            "value": 0.46,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418558 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 p999 latency",
            "value": 0.52,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418558 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc1 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc1 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=418558 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 request throughput",
            "value": 7052.64,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1269475 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 avg latency",
            "value": 2.22,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1269475 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 p99 latency",
            "value": 3.72,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1269475 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 p999 latency",
            "value": 4.59,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1269475 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc16 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc16 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1269475 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 request throughput",
            "value": 3835.4,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=690372 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 avg latency",
            "value": 0.49,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=690372 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 p99 latency",
            "value": 0.63,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=690372 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 p999 latency",
            "value": 0.78,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=690372 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc2 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc2 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=690372 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 request throughput",
            "value": 5780.08,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1040415 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 avg latency",
            "value": 0.66,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1040415 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 p99 latency",
            "value": 1.05,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1040415 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 p999 latency",
            "value": 1.41,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1040415 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc4 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc4 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1040415 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 request throughput",
            "value": 6751.67,
            "unit": "req/s",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1215300 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 avg latency",
            "value": 1.14,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1215300 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 p99 latency",
            "value": 1.97,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1215300 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 p999 latency",
            "value": 2.55,
            "unit": "ms",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1215300 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-2p1d-conc8 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-2p1d-conc8 router=pd policy=round_robin workers=3 prefill=2 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1215300 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 request throughput",
            "value": 2332.63,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=419874 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 avg latency",
            "value": 0.41,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=419874 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 p99 latency",
            "value": 0.46,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=419874 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 p999 latency",
            "value": 0.51,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=419874 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc1 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc1 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=1 duration_seconds=180 request_number=419874 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 request throughput",
            "value": 7109.83,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1279769 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 avg latency",
            "value": 2.21,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1279769 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 p99 latency",
            "value": 3.7,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1279769 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 p999 latency",
            "value": 4.63,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1279769 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc16 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc16 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=16 duration_seconds=180 request_number=1279769 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 request throughput",
            "value": 3847.17,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=692491 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 avg latency",
            "value": 0.49,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=692491 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 p99 latency",
            "value": 0.63,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=692491 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 p999 latency",
            "value": 0.78,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=692491 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc2 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc2 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=2 duration_seconds=180 request_number=692491 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 request throughput",
            "value": 5777.08,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1039875 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 avg latency",
            "value": 0.66,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1039875 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 p99 latency",
            "value": 1.05,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1039875 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 p999 latency",
            "value": 1.41,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1039875 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc4 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc4 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=4 duration_seconds=180 request_number=1039875 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 request throughput",
            "value": 6805.04,
            "unit": "req/s",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1224908 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 avg latency",
            "value": 1.13,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1224908 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 p99 latency",
            "value": 1.97,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1224908 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 p999 latency",
            "value": 2.54,
            "unit": "ms",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1224908 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          },
          {
            "name": "Atomesh-Mocker::pd-chat-3p1d-conc8 failed requests",
            "value": 0,
            "unit": "count",
            "extra": "cell=pd-chat-3p1d-conc8 router=pd policy=round_robin workers=4 prefill=3 decode=1 producers=1 consumers=8 duration_seconds=180 request_number=1224908 Run: https://github.com/ZhangDanyang-AMD/ATOM/actions/runs/43769476116"
          }
        ]
      }
    ]
  }
}