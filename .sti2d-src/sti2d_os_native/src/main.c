#include <eadk.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

const char eadk_app_name[]
#if PLATFORM_DEVICE
__attribute__((section(".rodata.eadk_app_name")))
#endif
= "STI2D OS";

const uint32_t eadk_api_level
#if PLATFORM_DEVICE
__attribute__((section(".rodata.eadk_api_level")))
#endif
= 0;

#define W 320
#define H 240
#define RGB565(r,g,b) (eadk_color_t)((((r)&0xF8)<<8)|(((g)&0xFC)<<3)|((b)>>3))

static const eadk_color_t BG=RGB565(8,6,18), TXT=0xFFFF, DIM=RGB565(170,166,188);
static const eadk_color_t BLUE=RGB565(64,156,255), GREEN=RGB565(48,209,88), ORANGE=RGB565(255,159,10);
static const eadk_color_t PURPLE=RGB565(191,90,242), TEAL=RGB565(90,214,222), RED=RGB565(255,69,58);
static const eadk_color_t PINK=RGB565(255,55,145), CARD=RGB565(27,24,38), CARD2=RGB565(42,34,58);
static bool exit_app=false;

static void rect(int x,int y,int w,int h,eadk_color_t c){
  if(x<0){w+=x;x=0;} if(y<0){h+=y;y=0;} if(x+w>W)w=W-x; if(y+h>H)h=H-y;
  if(w>0&&h>0)eadk_display_push_rect_uniform((eadk_rect_t){x,y,w,h},c);
}
static int isq(int n){int x=0;while((x+1)*(x+1)<=n)x++;return x;}
static void circ(int cx,int cy,int r,eadk_color_t c){for(int dy=-r;dy<=r;dy++){int dx=isq(r*r-dy*dy);rect(cx-dx,cy+dy,2*dx+1,1,c);}}
static void line(int x0,int y0,int x1,int y1,eadk_color_t c){
  int dx=abs(x1-x0),sx=x0<x1?1:-1,dy=-abs(y1-y0),sy=y0<y1?1:-1,e=dx+dy;
  for(;;){rect(x0,y0,2,2,c);if(x0==x1&&y0==y1)break;int e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}
}
static void roundrect(int x,int y,int w,int h,int r,eadk_color_t c){
  rect(x+r,y,w-2*r,h,c);rect(x,y+r,r,h-2*r,c);rect(x+w-r,y+r,r,h-2*r,c);
  circ(x+r,y+r,r,c);circ(x+w-r-1,y+r,r,c);circ(x+r,y+h-r-1,r,c);circ(x+w-r-1,y+h-r-1,r,c);
}
static void fill(eadk_color_t c){rect(0,0,W,H,c);}
static void wallpaper(void){
  rect(0,0,W,34,RGB565(31,14,52));rect(0,34,W,34,RGB565(26,13,48));rect(0,68,W,34,RGB565(21,12,42));
  rect(0,102,W,34,RGB565(17,10,35));rect(0,136,W,34,RGB565(13,8,28));rect(0,170,W,70,BG);
  circ(275,32,42,RGB565(46,21,67));circ(285,24,28,RGB565(58,24,78));circ(48,193,36,RGB565(18,20,48));
}

/* custom symbols: avoids broken Unicode glyphs */
static void phi_g(int x,int y,int s,eadk_color_t c){circ(x+s/2,y+s/2,s/3,c);circ(x+s/2,y+s/2,s/3-2,CARD);rect(x+s/2-1,y+1,3,s-2,c);}
static void eta_g(int x,int y,int s,eadk_color_t c){line(x+2,y+s-3,x+2,y+5,c);line(x+2,y+6,x+s/2,y+3,c);line(x+s/2,y+3,x+s-3,y+7,c);line(x+s-3,y+7,x+s-3,y+s+3,c);}
static void omega_g(int x,int y,int s,eadk_color_t c){line(x+3,y+s-5,x+1,y+s/2,c);line(x+1,y+s/2,x+4,y+3,c);line(x+4,y+3,x+s/2,y+1,c);line(x+s/2,y+1,x+s-4,y+3,c);line(x+s-4,y+3,x+s-1,y+s/2,c);line(x+s-1,y+s/2,x+s-3,y+s-5,c);rect(x+2,y+s-2,5,2,c);rect(x+s-7,y+s-2,5,2,c);}
static void delta_g(int x,int y,int s,eadk_color_t c){line(x+s/2,y+1,x+1,y+s-2,c);line(x+1,y+s-2,x+s-1,y+s-2,c);line(x+s-1,y+s-2,x+s/2,y+1,c);}
static void sigma_g(int x,int y,int s,eadk_color_t c){line(x+s-2,y+2,x+2,y+2,c);line(x+2,y+2,x+s/2,y+s/2,c);line(x+s/2,y+s/2,x+2,y+s-2,c);line(x+2,y+s-2,x+s-2,y+s-2,c);}
static void sqrt_g(int x,int y,int s,eadk_color_t c){line(x+1,y+s/2,x+4,y+s-2,c);line(x+4,y+s-2,x+8,y+2,c);line(x+8,y+2,x+s,y+2,c);}
static int match(const char*s,const char*t){return strncmp(s,t,strlen(t))==0;}
static void text(const char*s,int x,int y,bool big,eadk_color_t fg,eadk_color_t bg){
  int cx=x,sz=big?17:13,adv=big?10:7;
  while(*s){
    if(match(s,"{phi}")){phi_g(cx,y,sz,fg);cx+=sz+3;s+=5;continue;}
    if(match(s,"{eta}")){eta_g(cx,y,sz,fg);cx+=sz+3;s+=5;continue;}
    if(match(s,"{omega}")){omega_g(cx,y,sz,fg);cx+=sz+3;s+=7;continue;}
    if(match(s,"{delta}")){delta_g(cx,y,sz,fg);cx+=sz+3;s+=7;continue;}
    if(match(s,"{sigma}")){sigma_g(cx,y,sz,fg);cx+=sz+3;s+=7;continue;}
    if(match(s,"{sqrt}")){sqrt_g(cx,y,sz,fg);cx+=sz+4;s+=6;continue;}
    char t[2]={*s,0};eadk_display_draw_string(t,(eadk_point_t){cx,y},big,fg,bg);cx+=adv;s++;
  }
}
static bool kd(eadk_keyboard_state_t s,eadk_key_t k){return eadk_keyboard_key_down(s,k);}
static void release(void){while(eadk_keyboard_scan()!=0)eadk_timing_msleep(15);}
static int key(void){
  for(;;){eadk_keyboard_state_t s=eadk_keyboard_scan();
    if(kd(s,eadk_key_home)){release();return 7;} if(kd(s,eadk_key_up)){release();return 1;} if(kd(s,eadk_key_down)){release();return 2;}
    if(kd(s,eadk_key_left)){release();return 3;} if(kd(s,eadk_key_right)){release();return 4;}
    if(kd(s,eadk_key_ok)||kd(s,eadk_key_exe)){release();return 5;} if(kd(s,eadk_key_back)){release();return 6;} eadk_timing_msleep(20);
  }
}
static void top(const char*name,eadk_color_t a){rect(0,0,W,31,RGB565(13,10,24));roundrect(8,5,10,20,5,a);text(name,26,7,true,TXT,RGB565(13,10,24));text("STI2D",269,10,false,ORANGE,RGB565(13,10,24));}
static void foot(const char*s){rect(0,216,W,24,RGB565(10,8,19));text(s,8,222,false,DIM,RGB565(10,8,19));}

static eadk_color_t accent(const char*h){
  if(strstr(h,"PHYS")||strstr(h,"AC")||strstr(h,"BAT"))return GREEN;
  if(strstr(h,"MATH")||strstr(h,"DERIV"))return BLUE;
  if(strstr(h,"CONV")||strstr(h,"UNIT"))return ORANGE;
  if(strstr(h,"SUITE")||strstr(h,"u_n"))return PURPLE;
  if(strstr(h,"GAME")||strstr(h,"2048")||strstr(h,"FLAPPY")||strstr(h,"CHESS"))return PINK;
  return TEAL;
}
static int menu(const char*h,const char**it,int n){
  int s=0;for(;;){wallpaper();top(h,accent(h));int vis=4,st=s-1;if(st<0)st=0;if(st>n-vis)st=n-vis;if(st<0)st=0;int y=40;
    for(int i=st;i<n&&i<st+vis;i++){eadk_color_t c=i==s?CARD2:CARD;roundrect(12,y,296,38,10,c);if(i==s){roundrect(12,y,5,38,2,accent(h));circ(287,y+19,7,accent(h));text(">",284,y+11,true,BG,accent(h));}text(it[i],25,y+11,false,TXT,c);y+=43;}
    foot("UP/DOWN | OK ouvrir | BACK");
    int k=key();if(k==1)s=(s+n-1)%n;else if(k==2)s=(s+1)%n;else if(k==5)return s;else if(k==6)return-1;else if(k==7){exit_app=true;return-2;}
  }
}
static void msg(const char*h,const char**l,int n){
  int st=0;for(;;){wallpaper();top(h,accent(h));int y=42,shown=0;for(int i=st;i<n&&shown<6;i++,shown++){roundrect(12,y,296,26,8,CARD);text(l[i],21,y+7,false,TXT,CARD);y+=29;}foot("UP/DOWN lire | OK/BACK retour");
    int k=key();if(k==1&&st>0)st--;else if(k==2&&st+6<n)st++;else if(k==5||k==6)return;else if(k==7){exit_app=true;return;}
  }
}
static int dkey(eadk_keyboard_state_t k){if(kd(k,eadk_key_zero))return 0;if(kd(k,eadk_key_one))return 1;if(kd(k,eadk_key_two))return 2;if(kd(k,eadk_key_three))return 3;if(kd(k,eadk_key_four))return 4;if(kd(k,eadk_key_five))return 5;if(kd(k,eadk_key_six))return 6;if(kd(k,eadk_key_seven))return 7;if(kd(k,eadk_key_eight))return 8;if(kd(k,eadk_key_nine))return 9;return-1;}
static int input(const char*lab,double*v){
  char b[24]={0};int len=0;for(;;){wallpaper();top("SAISIE",ORANGE);text(lab,16,48,true,TXT,BG);text("Entre la valeur puis EXE",16,72,false,DIM,BG);roundrect(14,95,292,55,14,CARD2);text(len?b:"0",28,111,true,TXT,CARD2);foot("DEL effacer | EXE valider | BACK");
    eadk_keyboard_state_t k=eadk_keyboard_scan();int d=dkey(k);if(d>=0&&len<20){b[len++]=(char)('0'+d);b[len]=0;release();continue;}
    if(kd(k,eadk_key_dot)&&len<20){bool has=false;for(int i=0;i<len;i++)if(b[i]=='.')has=true;if(!has){if(len==0)b[len++]='0';b[len++]='.';b[len]=0;}release();continue;}
    if(kd(k,eadk_key_minus)&&len<20){if(len==0){b[len++]='-';b[len]=0;}else if(b[0]=='-'){memmove(b,b+1,len);len--;}else{memmove(b+1,b,len+1);b[0]='-';len++;}release();continue;}
    if(kd(k,eadk_key_backspace)||kd(k,eadk_key_left)){if(len>0)b[--len]=0;release();continue;}
    if(kd(k,eadk_key_ok)||kd(k,eadk_key_exe)){release();if(len==0||(len==1&&b[0]=='-'))continue;*v=strtod(b,NULL);return 0;}
    if(kd(k,eadk_key_back)){release();return-1;}if(kd(k,eadk_key_home)){release();exit_app=true;return-2;}eadk_timing_msleep(20);
  }
}
static double fsqrt(double x){if(x<=0)return 0;double g=x>1?x:1;for(int i=0;i<18;i++)g=.5*(g+x/g);return g;}
static double fpow(double b,int n){double r=1;if(n<0){for(int i=0;i<-n;i++)r*=b;return r?1/r:0;}for(int i=0;i<n;i++)r*=b;return r;}
static double af(double x){return x<0?-x:x;}
static void result(const char*h,const char*a,const char*b,const char*c){const char*l[]={a,b,c};msg(h,l,3);}

/* HOME */
static const char*appn[]={"Maths","Physique","Conversions","Suites","Formules","Symboles","Jeux","SOS"};
static eadk_color_t appc[8];
static void imath(int x,int y){line(x-15,y+10,x-5,y-5,TXT);line(x-5,y-5,x+4,y+2,TXT);line(x+4,y+2,x+15,y-13,TXT);circ(x-5,y-5,3,TXT);circ(x+4,y+2,3,TXT);}
static void iphys(int x,int y){line(x+5,y-16,x-9,y+2,TXT);line(x-9,y+2,x,y+2,TXT);line(x,y+2,x-6,y+17,TXT);line(x-6,y+17,x+12,y-5,TXT);line(x+12,y-5,x+3,y-5,TXT);}
static void iconv(int x,int y){line(x-15,y-7,x+12,y-7,TXT);line(x+12,y-7,x+6,y-12,TXT);line(x+12,y-7,x+6,y-2,TXT);line(x+15,y+8,x-12,y+8,TXT);line(x-12,y+8,x-6,y+3,TXT);line(x-12,y+8,x-6,y+13,TXT);}
static void iseq(int x,int y){circ(x-13,y+10,3,TXT);circ(x-4,y+4,4,TXT);circ(x+6,y-3,5,TXT);circ(x+16,y-11,6,TXT);}
static void iform(int x,int y,eadk_color_t bg){roundrect(x-13,y-17,26,34,4,TXT);rect(x-9,y-10,18,2,bg);rect(x-9,y-3,15,2,bg);rect(x-9,y+4,18,2,bg);}
static void igame(int x,int y,eadk_color_t bg){roundrect(x-18,y-10,36,22,8,TXT);rect(x-10,y-5,3,12,bg);rect(x-14,y-1,11,3,bg);circ(x+9,y-3,3,bg);circ(x+14,y+4,3,bg);}
static void isos(int x,int y){roundrect(x-4,y-16,8,32,4,TXT);roundrect(x-16,y-4,32,8,4,TXT);}
static void appicon(int i,int x,int y,int r){eadk_color_t c=appc[i];circ(x,y,r,c);circ(x-8,y-12,r/3,TXT);circ(x-8,y-12,r/3-2,c);if(i==0)imath(x,y);else if(i==1)iphys(x,y);else if(i==2)iconv(x,y);else if(i==3)iseq(x,y);else if(i==4)iform(x,y,c);else if(i==5)omega_g(x-12,y-12,24,TXT);else if(i==6)igame(x,y,c);else isos(x,y);}
static void home(int s){
  wallpaper();appc[0]=BLUE;appc[1]=GREEN;appc[2]=ORANGE;appc[3]=PURPLE;appc[4]=TEAL;appc[5]=RED;appc[6]=PINK;appc[7]=RGB565(116,103,255);
  text("STI2D OS",12,8,true,TXT,RGB565(31,14,52));text("Terminale",12,27,false,DIM,RGB565(31,14,52));roundrect(244,8,64,22,11,RGB565(29,25,40));text("HOME",260,14,false,DIM,RGB565(29,25,40));
  int xs[4]={50,123,197,270},ys[2]={91,157};for(int i=0;i<8;i++){int x=xs[i%4],y=ys[i/4],r=i==s?29:24;if(i==s){circ(x,y,r+4,TXT);circ(x,y,r+2,BG);}appicon(i,x,y,r);}
  roundrect(37,194,246,24,12,RGB565(25,21,36));circ(52,206,5,appc[s]);text(appn[s],66,200,true,TXT,RGB565(25,21,36));foot("ARROWS choisir | OK ouvrir | HOME");
}

/* MATH */
static void math_menu(void){
  const char*m[]={"Derivees","Tangente","Fonction inverse 1/x","Variations / Delta"};for(;;){int c=menu("MATH",m,4);if(c<0)return;
    if(c==0){const char*l[]={"(x^n)' = n*x^(n-1)","(u*v)' = u'v + uv'","(u/v)' = (u'v-uv')/v^2","(1/x)' = -1/x^2"};msg("DERIVEES",l,4);}
    else if(c==1){double a,fa,fpa;if(input("a",&a)||input("f(a)",&fa)||input("f'(a)",&fpa))continue;double b=fa-fpa*a;char x[64],y[64],z[64];snprintf(x,64,"y=f'(a)(x-a)+f(a)");snprintf(y,64,"y=%.5g*x %c %.5g",fpa,b>=0?'+':'-',af(b));snprintf(z,64,"pente f'(a)=%.5g",fpa);result("TANGENTE",x,y,z);}
    else if(c==2){double x;if(input("x pour f(x)=1/x",&x))continue;if(af(x)<1e-12){const char*l[]={"x=0 interdit","asymptote verticale x=0"};msg("1/x",l,2);continue;}char a[64],b[64];snprintf(a,64,"f(x)=%.6g",1/x);snprintf(b,64,"f'(x)=%.6g",-1/(x*x));result("1/x",a,b,"f'<0 : fonction decroissante");}
    else{const char*l[]={"f'(x)>0 -> f monte","f'(x)<0 -> f descend","f'(x)=0 -> point critique","Delta=b^2-4ac"};msg("VARIATIONS",l,4);}
  }
}

/* SUITES */
static void suites(void){
  const char*m[]={"u_n depuis u_0","u_n depuis u_1","q = u_n+1 / u_n","Somme geometrique","% -> q"};for(;;){int c=menu("SUITES",m,5);if(c<0)return;
    if(c==0||c==1){double u,q,n;if(input(c?"u_1":"u_0",&u)||input("q",&q)||input("n",&n))continue;int e=(int)n-(c?1:0);char a[64],b[64];snprintf(a,64,"u_n=%.6g",u*fpow(q,e));snprintf(b,64,"exposant=%d",e);result("u_n",c?"u_n=u_1*q^(n-1)":"u_n=u_0*q^n",a,b);}
    else if(c==2){double a,b;if(input("u_n",&a)||input("u_n+1",&b))continue;char r[64];snprintf(r,64,"q=%.6g",b/a);result("q","q=u_n+1/u_n",r,"raison constante");}
    else if(c==3){double a,q,N;if(input("1er terme",&a)||input("q",&q)||input("N nb termes",&N))continue;double s=af(q-1)<1e-12?a*N:a*(1-fpow(q,(int)N))/(1-q);char r[64];snprintf(r,64,"S=%.6g",s);result("SOMME","S=a(1-q^N)/(1-q)",r,"si q=1 : S=a*N");}
    else{const char*l[]={"hausse +p% : q=1+p/100","baisse -p% : q=1-p/100","+5% -> q=1.05","-8% -> q=0.92"};msg("% -> q",l,4);}
  }
}

/* PHYSICS */
static void battery(void){
  const char*m[]={"t=C/I autonomie","C=I*t capacite","E=U*C energie","P=U*I puissance","Rendement"};for(;;){int c=menu("BATTERIE",m,5);if(c<0)return;double a,b,r;char x[64],y[64];
    if(c==0){if(input("C [Ah]",&a)||input("I [A]",&b))continue;r=a/b;snprintf(x,64,"t=%.6g h",r);snprintf(y,64,"= %.6g min",r*60);result("AUTONOMIE",x,y,"C en Ah / I en A");}
    else if(c==1){if(input("I [A]",&a)||input("t [h]",&b))continue;r=a*b;snprintf(x,64,"C=%.6g Ah",r);snprintf(y,64,"= %.6g mAh",r*1000);result("CAPACITE",x,y,"C=I*t");}
    else if(c==2){if(input("U [V]",&a)||input("C [Ah]",&b))continue;r=a*b;snprintf(x,64,"E=%.6g Wh",r);snprintf(y,64,"= %.6g J",r*3600);result("ENERGIE",x,y,"1 Wh = 3600 J");}
    else if(c==3){if(input("U [V]",&a)||input("I [A]",&b))continue;r=a*b;snprintf(x,64,"P=%.6g W",r);result("PUISSANCE",x,"P=U*I","W = J/s");}
    else{if(input("E utile",&a)||input("E recue",&b))continue;r=a/b;snprintf(x,64,"{eta}=%.6g",r);snprintf(y,64,"{eta}=%.6g %%",r*100);result("RENDEMENT",x,y,"0 <= eta <= 1");}
  }
}
static void ac(void){
  const char*m[]={"Ueff Ieff cos phi -> P Q S","P S -> cos phi Q","P Q -> S cos phi","Umax -> Ueff","f -> T omega"};for(;;){int c=menu("AC  P Q S",m,5);if(c<0)return;double a,b,d;char x[64],y[64],z[64];
    if(c==0){if(input("Ueff [V]",&a)||input("Ieff [A]",&b)||input("cos {phi}",&d))continue;double S=a*b,P=S*d,Q=fsqrt(S*S-P*P);snprintf(x,64,"P=%.6g W",P);snprintf(y,64,"Q=%.6g var",Q);snprintf(z,64,"S=%.6g VA",S);result("P Q S",x,y,z);}
    else if(c==1){if(input("P [W]",&a)||input("S [VA]",&b))continue;double cp=a/b,Q=fsqrt(b*b-a*a);snprintf(x,64,"cos {phi}=%.6g",cp);snprintf(y,64,"Q=%.6g var",Q);result("cos {phi}",x,y,"S^2=P^2+Q^2");}
    else if(c==2){if(input("P [W]",&a)||input("Q [var]",&b))continue;double S=fsqrt(a*a+b*b),cp=S? a/S:0;snprintf(x,64,"S=%.6g VA",S);snprintf(y,64,"cos {phi}=%.6g",cp);result("S",x,y,"S=sqrt(P^2+Q^2)");}
    else if(c==3){if(input("Umax [V]",&a))continue;double u=a/fsqrt(2);snprintf(x,64,"Ueff=%.6g V",u);result("Ueff",x,"Ueff=Umax/sqrt(2)","Umax=sqrt(2)*Ueff");}
    else{if(input("f [Hz]",&a))continue;double T=1/a,w=2*3.141592653589793*a;snprintf(x,64,"T=%.6g s",T);snprintf(y,64,"{omega}=%.6g rad/s",w);result("f T {omega}",x,y,"50 Hz -> 20 ms");}
  }
}
static void physics(void){
  const char*m[]={"Accumulateur Ah","Regime sinusoidal P Q S","E=P*Delta t","Symboles AC"};for(;;){int c=menu("PHYSIQUE",m,4);if(c<0)return;if(c==0)battery();else if(c==1)ac();else if(c==2){double P,t;if(input("P [W]",&P)||input("{delta}t [s]",&t))continue;char a[64],b[64];double E=P*t;snprintf(a,64,"E=%.6g J",E);snprintf(b,64,"= %.6g Wh",E/3600);result("ENERGIE",a,b,"E=P*Delta t");}else{const char*l[]={"P [W] active","Q [var] reactive","S [VA] apparente","cos {phi}=P/S","{phi} dephasage U/I","S^2=P^2+Q^2","Ueff Ieff valeurs efficaces"};msg("SYMBOLES AC",l,7);}}
}

/* CONVERTER */
typedef struct{const char*n;double f;}Unit;typedef struct{const char*n;const Unit*u;int c;}Cat;
static const Unit EN[]={{"mJ",.001},{"J",1},{"kJ",1000},{"MJ",1e6},{"GJ",1e9},{"mWh",3.6},{"Wh",3600},{"kWh",3.6e6},{"MWh",3.6e9}};
static const Unit PW[]={{"mW",.001},{"W",1},{"kW",1000},{"MW",1e6},{"GW",1e9}},TM[]={{"ms",.001},{"s",1},{"min",60},{"h",3600}};
static const Unit VO[]={{"uV",1e-6},{"mV",.001},{"V",1},{"kV",1000}},CU[]={{"uA",1e-6},{"mA",.001},{"A",1},{"kA",1000}};
static const Unit CH[]={{"C",1},{"mAh",3.6},{"Ah",3600},{"kAh",3.6e6}},FR[]={{"Hz",1},{"kHz",1e3},{"MHz",1e6},{"GHz",1e9}};
static const Unit RE[]={{"Ohm",1},{"kOhm",1e3},{"MOhm",1e6}},LE[]={{"mm",.001},{"cm",.01},{"m",1},{"km",1000}};
static const Unit MA[]={{"mg",1e-6},{"g",.001},{"kg",1},{"t",1000}},SP[]={{"m/s",1},{"km/h",1.0/3.6}};
static const Unit PR[]={{"Pa",1},{"kPa",1e3},{"MPa",1e6},{"bar",1e5}},VL[]={{"mL",1e-6},{"L",.001},{"m3",1}};
static const Cat CT[]={{"E energie",EN,9},{"P puissance",PW,5},{"t temps",TM,4},{"U tension",VO,4},{"I courant",CU,4},{"C charge",CH,4},{"f frequence",FR,4},{"R resistance",RE,3},{"L longueur",LE,4},{"m masse",MA,4},{"v vitesse",SP,2},{"p pression",PR,4},{"V volume",VL,3}};
static int umenu(const char*h,const Unit*u,int n){const char*a[12];for(int i=0;i<n;i++)a[i]=u[i].n;return menu(h,a,n);}
static void converter(void){const char*a[16];int nc=sizeof(CT)/sizeof(CT[0]);for(int i=0;i<nc;i++)a[i]=CT[i].n;for(;;){int c=menu("CONVERSIONS",a,nc);if(c<0)return;const Cat*q=&CT[c];int f=umenu("DE",q->u,q->c);if(f<0)continue;int t=umenu("VERS",q->u,q->c);if(t<0)continue;double v;if(input("Valeur",&v))continue;double r=v*q->u[f].f/q->u[t].f;char x[64],y[64],z[64];snprintf(x,64,"%.6g %s",v,q->u[f].n);snprintf(y,64,"= %.6g %s",r,q->u[t].n);snprintf(z,64,"facteur %.6g",q->u[f].f/q->u[t].f);result("CONVERSION",x,y,z);}}

static void formulas(void){const char*l[]={"MATH (x^n)'=n*x^(n-1)","Produit (uv)'=u'v+uv'","Quotient (u/v)'=(u'v-uv')/v^2","Tangente y=f'(a)(x-a)+f(a)","Geo u_n=u_0*q^n","P=U*I","E=P*{delta}t","E[Wh]=U*C[Ah]","S=Ueff*Ieff","P=S*cos {phi}","S^2=P^2+Q^2","cos {phi}=P/S","Ueff=Umax/{sqrt}2","T=1/f","{omega}=2*pi*f","{eta}=utile/recue"};msg("FORMULES",l,16);}
static void symbols(void){const char*l[]={"P [W] puissance active","Q [var] puissance reactive","S [VA] puissance apparente","{phi} dephasage U/I","cos {phi}=P/S","U [V] tension","I [A] courant","E [J,Wh] energie","C [Ah] capacite","{delta}t duree","{eta} rendement","f [Hz] frequence","T [s] periode","{omega} [rad/s] pulsation","Ueff/Ieff RMS","u_n terme rang n","q raison geometrique","f'(x) derivee","{delta} discriminant"};msg("SYMBOLES",l,19);}
static void sos(void){const char*l[]={"Ah batterie -> PHYSIQUE","P Q S cos phi -> PHYSIQUE","W kW MW J kWh -> CONVERSIONS","u0 u1 q n -> SUITES","f'(x) -> MATH","Tangente -> MATH","Symbole inconnu -> SYMBOLES"};msg("SOS",l,7);}

/* compact games */
static eadk_color_t tc(int v){if(v==0)return RGB565(52,52,55);if(v<=4)return RGB565(238,228,218);if(v<=16)return RGB565(242,177,121);if(v<=64)return RGB565(246,94,59);return RGB565(237,194,46);}
static void add2(int*b){int e[16],n=0;for(int i=0;i<16;i++)if(!b[i])e[n++]=i;if(n)b[e[eadk_random()%n]]=(eadk_random()%10)?2:4;}
static bool mv2048(int*b,int dir){int old[16];memcpy(old,b,sizeof(old));for(int k=0;k<4;k++){int a[4]={0},n=0;for(int p=0;p<4;p++){int r,c;if(dir==0){r=k;c=p;}else if(dir==1){r=k;c=3-p;}else if(dir==2){r=p;c=k;}else{r=3-p;c=k;}int v=b[r*4+c];if(v)a[n++]=v;}int o[4]={0},m=0;for(int i=0;i<n;i++){if(i+1<n&&a[i]==a[i+1]){o[m++]=a[i]*2;i++;}else o[m++]=a[i];}for(int p=0;p<4;p++){int r,c;if(dir==0){r=k;c=p;}else if(dir==1){r=k;c=3-p;}else if(dir==2){r=p;c=k;}else{r=3-p;c=k;}b[r*4+c]=o[p];}}return memcmp(old,b,sizeof(old))!=0;}
static void draw2048(int*b){wallpaper();top("2048",PINK);int x0=58,y0=39,sz=49,g=4;for(int r=0;r<4;r++)for(int c=0;c<4;c++){int v=b[r*4+c],x=x0+c*(sz+g),y=y0+r*(sz+g);eadk_color_t cc=tc(v);roundrect(x,y,sz,sz,6,cc);if(v){char n[12];snprintf(n,12,"%d",v);text(n,x+sz/2-(int)strlen(n)*5,y+15,true,v<=4?RGB565(80,72,65):TXT,cc);}}foot("ARROWS move | BACK exit");}
static void game2048(void){int b[16]={0};add2(b);add2(b);for(;;){draw2048(b);int k=key();if(k==6)return;if(k==7){exit_app=true;return;}int d=k==3?0:k==4?1:k==1?2:k==2?3:-1;if(d>=0&&mv2048(b,d))add2(b);}}
static void flappy(void){double y=110,vy=0;int px=330,gap=112,score=0;bool pf=false;uint64_t last=eadk_timing_millis();for(;;){eadk_keyboard_state_t s=eadk_keyboard_scan();if(kd(s,eadk_key_back)){release();return;}if(kd(s,eadk_key_home)){release();exit_app=true;return;}bool f=kd(s,eadk_key_up)||kd(s,eadk_key_ok)||kd(s,eadk_key_exe);if(f&&!pf)vy=-4.7;pf=f;uint64_t now=eadk_timing_millis();double dt=(now-last)/33.0;if(dt<.5)dt=.5;if(dt>2)dt=2;last=now;vy+=.34*dt;y+=vy*dt;px-=(int)(3*dt);if(px<-40){px=330;gap=65+(eadk_random()%95);score++;}if(y<8||y>210||(px<74&&px+36>52&&(y-8<gap-39||y+8>gap+39))){const char*l[]={"Game over","OK recommencer","BACK quitter"};msg("FLAPPY",l,3);return;}eadk_color_t sky=RGB565(78,200,218),gr=RGB565(52,190,74);fill(sky);rect(px,0,36,gap-39,gr);rect(px,gap+39,36,218-gap-39,gr);circ(60,(int)y,8,RGB565(255,210,40));char q[16];snprintf(q,16,"%d",score);text(q,150,8,true,TXT,sky);foot("UP/OK flap | BACK");eadk_timing_msleep(28);}}
static void chess(void){char b[64];const char*r[8]={"rnbqkbnr","pppppppp","        ","        ","        ","        ","PPPPPPPP","RNBQKBNR"};for(int i=0;i<8;i++)memcpy(b+i*8,r[i],8);int cr=6,cc=0,sr=-1,sc=-1;for(;;){wallpaper();top("CHESS LITE",PINK);int x0=64,y0=34,sz=23;for(int rr=0;rr<8;rr++)for(int c=0;c<8;c++){int x=x0+c*sz,y=y0+rr*sz;eadk_color_t z=((rr+c)&1)?RGB565(80,125,78):RGB565(230,225,200);rect(x,y,sz,sz,z);if(rr==cr&&c==cc){rect(x,y,sz,2,BLUE);rect(x,y+sz-2,sz,2,BLUE);}if(rr==sr&&c==sc){rect(x,y,2,sz,ORANGE);rect(x+sz-2,y,2,sz,ORANGE);}char p=b[rr*8+c];if(p!=' '){char t[2]={p,0};text(t,x+7,y+4,true,(p>='A'&&p<='Z')?TXT:BG,z);}}foot("ARROWS | OK select/move | BACK");int k=key();if(k==6){if(sr>=0)sr=sc=-1;else return;}else if(k==7){exit_app=true;return;}else if(k==1)cr=(cr+7)%8;else if(k==2)cr=(cr+1)%8;else if(k==3)cc=(cc+7)%8;else if(k==4)cc=(cc+1)%8;else if(k==5){if(sr<0){if(b[cr*8+cc]!=' '){sr=cr;sc=cc;}}else{b[cr*8+cc]=b[sr*8+sc];b[sr*8+sc]=' ';sr=sc=-1;}}}}
static void games(void){const char*m[]={"2048","Flappy Bird","Chess Lite"};for(;;){int c=menu("GAMES",m,3);if(c<0)return;if(c==0)game2048();else if(c==1)flappy();else chess();if(exit_app)return;}}

int main(int argc,char**argv){(void)argc;(void)argv;int s=0;for(;;){if(exit_app)return 0;home(s);int k=key();if(k==6||k==7)return 0;int row=s/4,col=s%4;if(k==1||k==2)row=(row+1)%2;else if(k==3)col=(col+3)%4;else if(k==4)col=(col+1)%4;else if(k==5){if(s==0)math_menu();else if(s==1)physics();else if(s==2)converter();else if(s==3)suites();else if(s==4)formulas();else if(s==5)symbols();else if(s==6)games();else sos();if(exit_app)return 0;}s=row*4+col;}}
