require.config({
  paths: {
    "templates": "../../.tmp/jst"
  },
  shim: {
    "d3": {
      exports: "d3"
    },
    "backbone-d3": {
      deps: "d3"
    },
    'bootstrap-daterangepicker-reset': {
      deps: ["bootstrap", "moment"]
    }
  }
});