from pathlib import Path
import struct
import zlib
import sys

p = Path(sys.argv[1])
src = p.read_text(encoding="utf-8")
assert len(src.encode("utf-8")) == 29952, "Unexpected base source size"
src = src.replace('= "STI2D OS V3";', '= "STI2D OS V4";')
src = src.replace('text_at("V3",252,10,false,C_PURP,C_BG);', 'text_at("V4",252,10,false,C_PURP,C_BG);')
src = src.replace('static const char *home_symbols[8]={"f\'","PQS","<>","u_n","SUM","?","SOS","ADV"};', 'static const char *home_symbols[8]={"f(x)","PQS","<>","u_n","SUM","?","FX","ADV"};')
src = src.replace('static const char *home_names[8]={"Maths","Physique","Conversions","Suites","Formules","Symboles","Exercices","Avance"};', 'static const char *home_names[8]={"Maths","Physique","Conversions","Suites","Formules","Symboles","Resoudre","Avance"};')

start = src.index('static void math_menu(void) {')
end = src.index('\n/* ---------------- SUITES ---------------- */', start)
src = src[:start] + """static void fx_solver(void);
static void math_menu(void) {
  const char *m[]={"RESOUDRE EXERCICE f(x)","f' derivees (cours)","Tangente (valeurs connues)","1/x fonction inverse","Signe / variations"};
  for(;;) {
    int c=list_menu("MATHS",m,5); if(c<0) return;
    if(c==0) fx_solver();
    else if(c==1) math_derivative();
    else if(c==2) math_tangent();
    else if(c==3) math_inverse();
    else { const char *l[]={"f'(x)>0 : f croissante","f'(x)<0 : f decroissante","f'(x)=0 : point critique","Calcul automatique: RESOUDRE"}; message("VARIATIONS",l,4); }
    if(g_exit_app) return;
  }
}
""" + src[end:]
src = src.replace('else if(s==6) quick_sos();','else if(s==6) fx_solver();')
src += '\n#include "math_solver.c"\n'
assert '= "STI2D OS V4";' in src
assert 'fx_solver();' in src
assert '#include "math_solver.c"' in src
p.write_text(src, encoding="utf-8")
print("Patched main:", len(src.encode("utf-8")), "bytes")

icon_path = p.with_name("icon.png")
w, h = 55, 56
rows = []
for y in range(h):
    row = bytearray([0])
    for x in range(w):
        dx, dy = x-27, y-28
        if dx*dx + dy*dy < 24*24:
            t = (x+y)/(w+h)
            r, g, b = int(80+80*t), int(70+70*t), int(230+20*t)
        else:
            r = g = b = 0
        row += bytes((r, g, b, 255))
    rows.append(bytes(row))
raw = b''.join(rows)
def chunk(t, d):
    return struct.pack('>I',len(d)) + t + d + struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0)) + chunk(b'IDAT',zlib.compress(raw,9)) + chunk(b'IEND',b'')
icon_path.write_bytes(png)
print("Icon:", icon_path.stat().st_size, "bytes")
