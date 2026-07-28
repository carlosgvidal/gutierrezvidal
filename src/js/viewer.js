const spots=[...document.querySelectorAll('.hotspot')];
spots.forEach((s,i)=>{const yaw=Number(s.dataset.yaw);
s.style.left=(50+yaw*0.4)+'%';
s.style.transform='translate(-50%,-50%)';});
