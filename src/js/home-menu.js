const button=document.querySelector(".home-menu-button");
const menu=document.querySelector("#home-menu");

button?.addEventListener("click",()=>{
  const open=button.getAttribute("aria-expanded")==="true";
  button.setAttribute("aria-expanded",String(!open));
  menu.hidden=open;
});

document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&!menu.hidden){
    menu.hidden=true;
    button.setAttribute("aria-expanded","false");
    button.focus();
  }
});
