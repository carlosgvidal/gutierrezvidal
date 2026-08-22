from __future__ import annotations

def reciprocity(a_to_b:float,b_to_a:float)->float|None:
    den=a_to_b+b_to_a
    return None if den<=0 else 2.0*min(a_to_b,b_to_a)/den

def directional_asymmetry(a_to_b:float,b_to_a:float)->float|None:
    den=a_to_b+b_to_a
    return None if den<=0 else (a_to_b-b_to_a)/den

def persistence(active_windows:int,total_windows:int)->float|None:
    if total_windows<=0 or active_windows<0 or active_windows>total_windows: return None
    return active_windows/total_windows
