"use strict";

document.getElementById("analyzeBtn").addEventListener("click", analyze);
document.getElementById("transferBtn").addEventListener("click", transferActors);
document.getElementById("simulateBtn").addEventListener("click", simulate);
document.getElementById("focalActor").addEventListener("change", () => {
  focalActorId = getFocalActorId();
  lastEngine = null;
});
document.getElementById("simulationSeed").addEventListener("input", () => { lastEngine = null; });
document.getElementById("reportBtn").addEventListener("click", generateReport);
document.querySelector("#actors tbody").addEventListener("input", refreshFocalSelector);
document.getElementById("testsBtn").onclick = runSelfTests;
refreshFocalSelector();

document.getElementById("issueInput").addEventListener("input",()=>{lastEngine=null;});
