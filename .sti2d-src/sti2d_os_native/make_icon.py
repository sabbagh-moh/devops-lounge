import struct,zlib,sys
out=sys.argv[1] if len(sys.argv)>1 else 'src/icon.png'
w,h=55,56; rows=[]
for y in range(h):
    row=bytearray([0])
    for x in range(w):
        dx=x-27; dy=y-28
        if dx*dx+dy*dy<24*24:
            t=(x+y)/(w+h); r=int(80+80*t); g=int(70+70*t); b=int(230+20*t)
        else:r=g=b=0
        row+=bytes((r,g,b,255))
    rows.append(bytes(row))
raw=b''.join(rows)
def ch(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',zlib.crc32(t+d)&0xffffffff)
png=b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+ch(b'IDAT',zlib.compress(raw,9))+ch(b'IEND',b'')
open(out,'wb').write(png)
