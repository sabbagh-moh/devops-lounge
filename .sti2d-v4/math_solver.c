/* STI2D OS V4 - Direct function solver, algebraic expressions and full steps */
#include <stdarg.h>
#include <ctype.h>

#define FX_DEG 18
#define FX_STEPS 72
#define FX_WIDTH 34
#define FX_ROOTS 24

typedef struct { double v[FX_DEG+1]; int deg; bool ok; } FxPoly;
typedef struct { FxPoly a,b; bool ok; } FxRat;
typedef struct { char msg[FX_STEPS][144]; int count; } FxSteps;
typedef struct { const char *ptr; char error[96]; } FxParser;

static FxRat fx_current;
static char fx_expr[120]="";
static bool fx_has_function=false;

static void fx_lines_add(FxSteps *s,const char *fmt,...) {
  if(s->count>=FX_STEPS) return;
  va_list ap;va_start(ap,fmt);
  vsnprintf(s->msg[s->count],sizeof(s->msg[0]),fmt,ap);
  va_end(ap); s->count++;
}

static void fx_steps_view(const char *heading,FxSteps *s) {
  static char wrapped[200][FX_WIDTH+1]; int total=0;
  for(int i=0;i<s->count;i++) {
    const char *p=s->msg[i];
    if(!*p) { if(total<200) wrapped[total++][0]=0; continue; }
    while(*p && total<200) {
      int n=(int)strlen(p);
      if(n>FX_WIDTH) {
        n=FX_WIDTH;
        while(n>15 && p[n]!=' ' && p[n]!='+' && p[n]!='-' && p[n]!='=') n--;
        if(n<=15) n=FX_WIDTH;
      }
      memcpy(wrapped[total],p,n); wrapped[total][n]=0;
      total++; p+=n; while(*p==' ')p++;
    }
  }
  int top=0,dirty=1;
  wait_release_all();
  for(;;) {
    if(dirty) {
      fill(C_BG); title(heading);
      for(int i=0;i<8 && top+i<total;i++) {
        text_at(wrapped[top+i],10,41+i*21,false,i==0?C_TEXT:C_TEXT,C_BG);
      }
      char footerline[80];
      snprintf(footerline,sizeof(footerline),"%d-%d/%d   UP/DOWN   BACK",total?top+1:0,(top+8<total)?top+8:total,total);
      footer(footerline); dirty=0;
    }
    int k=key_wait();
    if(k==1 && top>0) {top--;dirty=1;}
    else if(k==2 && top+8<total) {top++;dirty=1;}
    else if(k==6 || k==5) return;
    else if(k==7) {g_exit_app=true;return;}
  }
}

static FxPoly fx_poly_zero(void) {
  FxPoly p;memset(&p,0,sizeof(p));p.ok=true;return p;
}
static FxPoly fx_poly_constant(double c) {
  FxPoly p=fx_poly_zero();p.v[0]=c;return p;
}
static FxPoly fx_poly_x(void) {
  FxPoly p=fx_poly_zero();p.v[1]=1;p.deg=1;return p;
}
static FxPoly fx_poly_bad(void) {FxPoly p=fx_poly_zero();p.ok=false;return p;}
static FxPoly fx_poly_norm(FxPoly p) {
  while(p.deg>0 && fabs(p.v[p.deg])<1e-10) p.deg--;
  return p;
}
static FxPoly fx_poly_add(FxPoly a,FxPoly b,int sign) {
  if(!a.ok||!b.ok)return fx_poly_bad();
  FxPoly r=fx_poly_zero(); r.deg=a.deg>b.deg?a.deg:b.deg;
  for(int i=0;i<=r.deg;i++)r.v[i]=a.v[i]+sign*b.v[i];
  return fx_poly_norm(r);
}
static FxPoly fx_poly_mul(FxPoly a,FxPoly b) {
  if(!a.ok||!b.ok||a.deg+b.deg>FX_DEG)return fx_poly_bad();
  FxPoly r=fx_poly_zero();r.deg=a.deg+b.deg;
  for(int i=0;i<=a.deg;i++)for(int j=0;j<=b.deg;j++)r.v[i+j]+=a.v[i]*b.v[j];
  return fx_poly_norm(r);
}
static FxPoly fx_poly_der(FxPoly a) {
  FxPoly r=fx_poly_zero();if(!a.ok)return fx_poly_bad();
  if(a.deg==0)return r;
  r.deg=a.deg-1;
  for(int i=1;i<=a.deg;i++)r.v[i-1]=a.v[i]*i;
  return fx_poly_norm(r);
}
static double fx_poly_eval(FxPoly a,double x) {
  double v=a.v[a.deg];for(int i=a.deg-1;i>=0;i--)v=v*x+a.v[i];return v;
}
static bool fx_poly_iszero(FxPoly p) {return p.deg==0 && fabs(p.v[0])<1e-11;}
static FxRat fx_rat_bad(void) {FxRat r;r.a=fx_poly_bad();r.b=fx_poly_bad();r.ok=false;return r;}
static FxRat fx_rat_poly(FxPoly p) {FxRat r;r.a=p;r.b=fx_poly_constant(1);r.ok=p.ok;return r;}
static FxRat fx_rat_const(double n) {return fx_rat_poly(fx_poly_constant(n));}
static FxRat fx_rat_add(FxRat a,FxRat b,int sign) {
  if(!a.ok||!b.ok)return fx_rat_bad();
  FxRat r;
  r.a=fx_poly_add(fx_poly_mul(a.a,b.b),fx_poly_mul(b.a,a.b),sign);
  r.b=fx_poly_mul(a.b,b.b);r.ok=r.a.ok&&r.b.ok;
  return r;
}
static FxRat fx_rat_mul(FxRat a,FxRat b) {
  FxRat r;r.a=fx_poly_mul(a.a,b.a);r.b=fx_poly_mul(a.b,b.b);
  r.ok=a.ok&&b.ok&&r.a.ok&&r.b.ok;return r;
}
static FxRat fx_rat_div(FxRat a,FxRat b) {
  if(!a.ok||!b.ok||fx_poly_iszero(b.a))return fx_rat_bad();
  FxRat r;r.a=fx_poly_mul(a.a,b.b);r.b=fx_poly_mul(a.b,b.a);
  r.ok=r.a.ok&&r.b.ok;return r;
}
static FxRat fx_rat_pow(FxRat r,int exponent) {
  if(exponent<-9||exponent>9)return fx_rat_bad();
  if(exponent<0) {if(fx_poly_iszero(r.a))return fx_rat_bad();FxPoly tmp=r.a;r.a=r.b;r.b=tmp;exponent=-exponent;}
  FxRat out=fx_rat_const(1);
  for(int i=0;i<exponent;i++) {out=fx_rat_mul(out,r);if(!out.ok)break;}
  return out;
}
static double fx_rat_eval(FxRat r,double x,bool *valid) {
  double n=fx_poly_eval(r.a,x),d=fx_poly_eval(r.b,x);
  if(!isfinite(n)||!isfinite(d)||fabs(d)<1e-13) {*valid=false;return 0;}
  *valid=true;return n/d;
}
static FxRat fx_rat_der(FxRat r) {
  FxRat d;d.a=fx_poly_add(fx_poly_mul(fx_poly_der(r.a),r.b),fx_poly_mul(r.a,fx_poly_der(r.b)),-1);
  d.b=fx_poly_mul(r.b,r.b);d.ok=r.ok&&d.a.ok&&d.b.ok;return d;
}
static void fx_strpoly(FxPoly p,char *s,int size) {
  s[0]=0;int used=0;
  if(fx_poly_iszero(p)) {snprintf(s,size,"0");return;}
  for(int i=p.deg;i>=0;i--) {
    double c=p.v[i];if(fabs(c)<1e-10)continue;
    char item[44];double v=fabs(c);
    if(i==0)snprintf(item,sizeof(item),"%.6g",v);
    else if(fabs(v-1)<1e-10)snprintf(item,sizeof(item),i==1?"x":"x^%d",i);
    else if(i==1)snprintf(item,sizeof(item),"%.6gx",v);
    else snprintf(item,sizeof(item),"%.6gx^%d",v,i);
    const char *sgn=used?(c<0?" - ":" + "):(c<0?"-":"");
    int space=size-(int)strlen(s)-1;
    if(space>1)strncat(s,sgn,space);
    space=size-(int)strlen(s)-1;
    if(space>1)strncat(s,item,space);
    used++;
  }
}
static void fx_strrat(FxRat r,char *s,int n) {
  char a[240],b[240];fx_strpoly(r.a,a,sizeof(a));fx_strpoly(r.b,b,sizeof(b));
  if(r.b.deg==0 && fabs(r.b.v[0]-1)<1e-10)snprintf(s,n,"%s",a);
  else snprintf(s,n,"(%s)/(%s)",a,b);
}

static void fx_skip(FxParser *p) {while(*p->ptr==' ')p->ptr++;}
static void fx_error(FxParser *p,const char *s) {if(!p->error[0])snprintf(p->error,sizeof(p->error),"%s",s);}
static FxRat fx_parse_sum(FxParser *p);

static FxRat fx_parse_atom(FxParser *p) {
  fx_skip(p);
  char c=*p->ptr;
  if(c=='(') {
    p->ptr++;FxRat r=fx_parse_sum(p);fx_skip(p);
    if(*p->ptr!=')') {fx_error(p,"Parenthese ) manquante");return fx_rat_bad();}
    p->ptr++;return r;
  }
  if(c=='x'||c=='X') {p->ptr++;return fx_rat_poly(fx_poly_x());}
  if((c>='0'&&c<='9')||c=='.') {
    char *end;double x=strtod(p->ptr,&end);
    if(end==p->ptr || !isfinite(x)) {fx_error(p,"Nombre non valide");return fx_rat_bad();}
    p->ptr=end;return fx_rat_const(x);
  }
  fx_error(p,"Utilise x, chiffres et ( )");return fx_rat_bad();
}
static FxRat fx_parse_power(FxParser *p) {
  fx_skip(p);
  int negative=0;
  while(*p->ptr=='+'||*p->ptr=='-') {if(*p->ptr=='-')negative=!negative;p->ptr++;fx_skip(p);}
  FxRat r=fx_parse_atom(p);
  fx_skip(p);
  if(*p->ptr=='^') {
    p->ptr++;fx_skip(p);int paren=0;
    if(*p->ptr=='('){paren=1;p->ptr++;fx_skip(p);}
    int sign=1;if(*p->ptr=='-') {sign=-1;p->ptr++;}else if(*p->ptr=='+')p->ptr++;
    if(*p->ptr<'0'||*p->ptr>'9'){fx_error(p,"Puissance: entier 0 a 9");return fx_rat_bad();}
    int exp=0;while(*p->ptr>='0'&&*p->ptr<='9') {exp=exp*10+(*p->ptr-'0');p->ptr++;if(exp>9)break;}
    if(paren) {fx_skip(p);if(*p->ptr!=')') {fx_error(p,"Ferme l'exposant avec )");return fx_rat_bad();}p->ptr++;}
    r=fx_rat_pow(r,sign*exp);
    if(!r.ok)fx_error(p,"Degré trop grand (max 18)");
  }
  if(negative)r=fx_rat_mul(r,fx_rat_const(-1));
  return r;
}
static FxRat fx_parse_product(FxParser *p) {
  FxRat r=fx_parse_power(p);if(!r.ok)return r;
  for(;;) {
    fx_skip(p);char c=*p->ptr;int div=0;
    if(c=='*'||c=='/') {div=(c=='/');p->ptr++;}
    else if(c=='x'||c=='X'||c=='('||(c>='0'&&c<='9')) {/* multiplication implicite */}
    else break;
    FxRat next=fx_parse_power(p);
    if(!next.ok)return next;
    r=div?fx_rat_div(r,next):fx_rat_mul(r,next);
    if(!r.ok) {fx_error(p,"Expression trop complexe");return r;}
  }
  return r;
}
static FxRat fx_parse_sum(FxParser *p) {
  FxRat r=fx_parse_product(p);
  while(r.ok) {
    fx_skip(p);char op=*p->ptr;
    if(op!='+'&&op!='-')break;
    p->ptr++;FxRat next=fx_parse_product(p);
    r=fx_rat_add(r,next,op=='+'?1:-1);
    if(!r.ok) {fx_error(p,"Expression trop complexe");break;}
  }
  return r;
}
static FxRat fx_parse(const char *s,char *err,int n) {
  FxParser p;p.ptr=s;p.error[0]=0;
  FxRat r=fx_parse_sum(&p);fx_skip(&p);
  if(!*s)fx_error(&p,"Entre d'abord f(x)");
  else if(*p.ptr && !p.error[0])fx_error(&p,"Caractere non reconnu");
  if(!r.ok && !p.error[0])fx_error(&p,"Fonction non prise en charge");
  if(r.ok && fx_poly_iszero(r.b))fx_error(&p,"Denominateur = 0");
  if(p.error[0]) {snprintf(err,n,"%s",p.error);return fx_rat_bad();}
  err[0]=0;return r;
}

/* Editing directly with the physical NumWorks expression keys. */
static int fx_input(char *out,int capacity) {
  int len=(int)strlen(out);if(len>=capacity)len=0;
  int dirty=1;wait_release_all();
  for(;;) {
    if(dirty) {
      fill(C_BG);title("SAISIR f(x)");
      text_at("Tape la fonction de l'exo",12,42,false,C_DIM,C_BG);
      card_border(10,66,300,61,11,C_PURP,C_CARD);
      char preview[45];
      if(len>34)snprintf(preview,sizeof(preview),"...%s",out+len-32);
      else snprintf(preview,sizeof(preview),"%s",len?out:"f(x) = ?");
      text_at(preview,18,83,false,C_TEXT,C_CARD);
      text_at("2x^2-5x+3",14,143,false,C_DIM,C_BG);
      text_at("(2x+3)/(x-1)",14,161,false,C_DIM,C_BG);
      text_at("x: XNT  ^: x^y   ( )",14,183,false,C_TEXT,C_BG);
      footer("EXE valider | DEL effacer | BACK");dirty=0;
    }
    eadk_keyboard_state_t k=eadk_keyboard_scan();
    char add[6]={0};int d=digit_for_key(k);
    if(d>=0)add[0]=(char)('0'+d);
    else if(down(k,eadk_key_xnt))add[0]='x';
    else if(down(k,eadk_key_plus))add[0]='+';
    else if(down(k,eadk_key_minus))add[0]='-';
    else if(down(k,eadk_key_multiplication))add[0]='*';
    else if(down(k,eadk_key_division))add[0]='/';
    else if(down(k,eadk_key_power))add[0]='^';
    else if(down(k,eadk_key_square)) {add[0]='^';add[1]='2';}
    else if(down(k,eadk_key_left_parenthesis))add[0]='(';
    else if(down(k,eadk_key_right_parenthesis))add[0]=')';
    else if(down(k,eadk_key_dot))add[0]='.';
    if(add[0]) {
      int n=(int)strlen(add);
      if(len+n<capacity){memcpy(out+len,add,n+1);len+=n;dirty=1;}
      wait_release_all();continue;
    }
    if(down(k,eadk_key_backspace)||down(k,eadk_key_left)) {
      if(len>0){out[--len]=0;dirty=1;}wait_release_all();continue;
    }
    if(down(k,eadk_key_exe)||down(k,eadk_key_ok)) {
      wait_release_all();if(len==0)continue;return 0;
    }
    if(down(k,eadk_key_back)) {wait_release_all();return -1;}
    if(down(k,eadk_key_home)) {wait_release_all();g_exit_app=true;return -2;}
    eadk_timing_msleep(25);
  }
}

/* Exact polynomial real root isolation using recursive derivative and bisection. */
static int fx_roots(FxPoly p,double *roots,int limit);
static void fx_root_add(double *r,int *n,int limit,double x) {
  if(!isfinite(x)||*n>=limit)return;
  for(int i=0;i<*n;i++)if(fabs(r[i]-x)<1e-6*(1+fabs(x)))return;
  int j=(*n)++;while(j>0 && r[j-1]>x){r[j]=r[j-1];j--; }r[j]=x;
}
static bool fx_is_root(FxPoly p,double x) {
  double scale=1;
  for(int i=p.deg;i>=0;i--) scale=scale*(1+fabs(x))+fabs(p.v[i]);
  return fabs(fx_poly_eval(p,x))<1e-8*scale;
}
static int fx_roots(FxPoly p,double *roots,int limit) {
  p=fx_poly_norm(p);int n=0;
  if(p.deg<1)return 0;
  if(p.deg==1) {fx_root_add(roots,&n,limit,-p.v[0]/p.v[1]);return n;}
  if(p.deg>8)return -1;
  double critical[FX_ROOTS];int cn=fx_roots(fx_poly_der(p),critical,FX_ROOTS);
  if(cn<0)return -1;
  double B=1.0;
  for(int i=0;i<p.deg;i++) {
    double v=fabs(p.v[i]/p.v[p.deg]);if(v>B)B=v;
  }
  B=B+2;if(B>1e8)B=1e8;
  for(int i=0;i<cn;i++)if(fx_is_root(p,critical[i]))fx_root_add(roots,&n,limit,critical[i]);
  double left=-B;
  for(int j=0;j<=cn;j++) {
    double right=j==cn?B:critical[j];
    if(right<=left){left=right;continue;}
    double fl=fx_poly_eval(p,left),fr=fx_poly_eval(p,right);
    if((fl<0&&fr>0)||(fl>0&&fr<0)) {
      double lo=left,hi=right;
      for(int k=0;k<75;k++) {
        double mid=(lo+hi)*.5, fm=fx_poly_eval(p,mid);
        if((fl<0&&fm<0)||(fl>0&&fm>0)){lo=mid;fl=fm;}else hi=mid;
      }
      fx_root_add(roots,&n,limit,(lo+hi)*.5);
    }
    left=right;
  }
  return n;
}

static void fx_append_function(FxSteps *s) {
  fx_lines_add(s,"Donnee: f(x) = %s",fx_expr);
  fx_lines_add(s,"");
}
static void fx_output_value(void) {
  double a;if(input_double("Valeur de x = a",&a))return;
  static FxSteps st; memset(&st,0,sizeof(st));bool ok;double v=fx_rat_eval(fx_current,a,&ok);
  fx_append_function(&st);
  fx_lines_add(&st,"1. Remplacer x par a = %.6g",a);
  char ns[220],ds[220];fx_strpoly(fx_current.a,ns,sizeof(ns));fx_strpoly(fx_current.b,ds,sizeof(ds));
  fx_lines_add(&st,"Numerateur N(x) = %s",ns);
  fx_lines_add(&st,"Denominateur D(x) = %s",ds);
  fx_lines_add(&st,"2. N(a) = %.8g",fx_poly_eval(fx_current.a,a));
  fx_lines_add(&st,"3. D(a) = %.8g",fx_poly_eval(fx_current.b,a));
  if(ok)fx_lines_add(&st,"4. f(a) = N(a)/D(a) = %.8g",v);
  else fx_lines_add(&st,"Impossible: D(a) = 0.");
  fx_steps_view("CALCUL f(a)",&st);
}
static void fx_output_derivative(void) {
  static FxSteps st; memset(&st,0,sizeof(st));FxRat dr=fx_rat_der(fx_current);
  fx_append_function(&st);
  FxPoly a=fx_current.a,b=fx_current.b,da=fx_poly_der(a),db=fx_poly_der(b);
  char A[220],B[220],DA[220],DB[220],NUM[220],DEN[220];
  fx_strpoly(a,A,sizeof(A));fx_strpoly(b,B,sizeof(B));fx_strpoly(da,DA,sizeof(DA));fx_strpoly(db,DB,sizeof(DB));
  if(b.deg==0&&fabs(b.v[0]-1)<1e-10) {
    fx_lines_add(&st,"1. Developper: f(x)=%s",A);
    fx_lines_add(&st,"2. (x^n)' = n*x^(n-1)");
    fx_lines_add(&st,"3. Deriver terme par terme:");
    fx_lines_add(&st,"f'(x) = %s",DA);
  }else {
    fx_lines_add(&st,"1. Poser N(x)=%s",A);
    fx_lines_add(&st,"   et D(x)=%s",B);
    fx_lines_add(&st,"2. N'(x)=%s",DA);
    fx_lines_add(&st,"   D'(x)=%s",DB);
    fx_lines_add(&st,"3. Formule du quotient:");
    fx_lines_add(&st,"f'=(N'D-ND')/D^2");
    if(dr.ok) {
      fx_strpoly(dr.a,NUM,sizeof(NUM));fx_strpoly(dr.b,DEN,sizeof(DEN));
      fx_lines_add(&st,"4. Numerateur simplifie:");
      fx_lines_add(&st,"%s",NUM);
      fx_lines_add(&st,"5. Denominateur:");
      fx_lines_add(&st,"%s",DEN);
      fx_lines_add(&st,"6. f'(x)=(%s)/(%s)",NUM,DEN);
    }else fx_lines_add(&st,"Calcul symbolique trop grand.");
  }
  fx_steps_view("DERIVEE ET ETAPES",&st);
}
static void fx_output_tangent(void) {
  double x;if(input_double("Tangente en x = a",&x))return;
  static FxSteps st; memset(&st,0,sizeof(st));FxRat dr=fx_rat_der(fx_current);bool v1,v2;
  double f=fx_rat_eval(fx_current,x,&v1),d=fx_rat_eval(dr,x,&v2);
  fx_append_function(&st);
  fx_lines_add(&st,"1. Formule de tangente:");
  fx_lines_add(&st,"y=f'(a)(x-a)+f(a)");
  fx_lines_add(&st,"2. a=%.6g",x);
  if(!v1||!v2||!dr.ok)fx_lines_add(&st,"Pas de tangente: f non definie ou non derivable ici.");
  else {
    fx_lines_add(&st,"3. f(a)=%.8g",f);
    fx_lines_add(&st,"4. f'(a)=%.8g",d);
    fx_lines_add(&st,"5. Substitution:");
    fx_lines_add(&st,"y=%.6g(x-(%.6g))+(%.6g)",d,x,f);
    fx_lines_add(&st,"6. Equation finale:");
    fx_lines_add(&st,"y=%.8gx %c %.8g",d,(f-d*x)>=0?'+':'-',fabs(f-d*x));
  }
  fx_steps_view("TANGENTE",&st);
}
static int fx_zero_order(FxPoly p,double a,double *lead) {
  for(int k=0;k<=p.deg;k++) {
    double value=fx_poly_eval(p,a);
    if(fabs(value)>1e-8) {*lead=value;return k;}
    p=fx_poly_der(p);
  }
  *lead=0;return 100;
}
static void fx_limit_at(void) {
  const char *type[]={"x -> a (2 cotes)","x -> a- (gauche)","x -> a+ (droite)"};
  int side=list_menu("LIMITE EN a",type,3);if(side<0)return;
  double a;if(input_double("a",&a))return;
  static FxSteps st; memset(&st,0,sizeof(st));fx_append_function(&st);
  fx_lines_add(&st,"1. Calculer N(a) et D(a):");
  double n=fx_poly_eval(fx_current.a,a),d=fx_poly_eval(fx_current.b,a);
  fx_lines_add(&st,"N(a)=%.8g",n);fx_lines_add(&st,"D(a)=%.8g",d);
  if(fabs(d)>1e-9) {
    fx_lines_add(&st,"2. D(a) != 0, substitution.");
    fx_lines_add(&st,"lim f(x) = %.8g",n/d);
  }else {
    fx_lines_add(&st,"2. D(a)=0, forme a etudier.");
    double np,dp;int na=fx_zero_order(fx_current.a,a,&np),nb=fx_zero_order(fx_current.b,a,&dp);
    if(na>=100)fx_lines_add(&st,"N(x)=0: fonction nulle sur son domaine.");
    else {
      int k=na-nb;double coeff=np/dp;
      fx_lines_add(&st,"Ordre de N: %d; de D: %d",na,nb);
      fx_lines_add(&st,"Comportement ~ %.6g(x-a)^%d",coeff,k);
      if(k>=0) {
        fx_lines_add(&st,"3. Limite finie:");
        fx_lines_add(&st,"lim f(x)=%.8g",k==0?coeff:0.0);
        fx_lines_add(&st,"(trou possible en x=a)");
      } else {
        if(side==0 && ((-k)%2)==1)fx_lines_add(&st,"3. Deux cotes opposes: pas de limite bilaterale.");
        else {
          int sign=coeff>0?1:-1;
          if(side==1 && ((-k)%2)==1)sign=-sign;
          fx_lines_add(&st,"3. Limite = %s infini",sign>0?"+":"-");
          if(side==0)fx_lines_add(&st,"Meme signe des 2 cotes.");
        }
        if(side==0 && ((-k)%2)==1) {
          fx_lines_add(&st,"a- : %s infini",coeff>0?"-":"+");
          fx_lines_add(&st,"a+ : %s infini",coeff>0?"+":"-");
        }
      }
    }
  }
  fx_steps_view("CALCUL DE LIMITE",&st);
}
static void fx_limit_inf(void) {
  const char *sides[]={"x -> +infini","x -> -infini"};
  int side=list_menu("LIMITE INFINIE",sides,2);if(side<0)return;
  static FxSteps st; memset(&st,0,sizeof(st));fx_append_function(&st);
  FxPoly p=fx_current.a,q=fx_current.b;
  fx_lines_add(&st,"1. Comparer les degres:");
  fx_lines_add(&st,"deg N = %d, deg D = %d",p.deg,q.deg);
  fx_lines_add(&st,"2. Coefficients dominants:");
  fx_lines_add(&st,"N: %.8g ; D: %.8g",p.v[p.deg],q.v[q.deg]);
  int diff=p.deg-q.deg;
  if(fx_poly_iszero(p))fx_lines_add(&st,"lim f(x) = 0");
  else if(diff<0) {
    fx_lines_add(&st,"3. deg N < deg D");fx_lines_add(&st,"lim f(x)=0");
  }else if(diff==0) {
    fx_lines_add(&st,"3. Degres egaux:");
    fx_lines_add(&st,"lim = %.8g/%.8g",p.v[p.deg],q.v[q.deg]);
    fx_lines_add(&st,"lim f(x)=%.8g",p.v[p.deg]/q.v[q.deg]);
  }else {
    int sign=p.v[p.deg]/q.v[q.deg]>0?1:-1;
    if(side==1 && diff%2==1)sign=-sign;
    fx_lines_add(&st,"3. Deg N > deg D:");
    fx_lines_add(&st,"f(x) ~ %.8g*x^%d",p.v[p.deg]/q.v[q.deg],diff);
    fx_lines_add(&st,"lim f(x)=%s infini",sign>0?"+":"-");
  }
  fx_steps_view("LIMITE INFINIE",&st);
}
static void fx_output_equation(void) {
  double y;if(input_double("Resoudre f(x) =",&y))return;
  static FxSteps st; memset(&st,0,sizeof(st));fx_append_function(&st);
  FxPoly eq=fx_poly_add(fx_current.a,fx_poly_mul(fx_current.b,fx_poly_constant(y)),-1);
  char expr[220];fx_strpoly(eq,expr,sizeof(expr));
  fx_lines_add(&st,"1. Chercher f(x)=%.6g",y);
  fx_lines_add(&st,"N(x)/D(x)=%.6g",y);
  fx_lines_add(&st,"2. N(x)-%.6g*D(x)=0",y);
  fx_lines_add(&st,"3. Equivaut a:");fx_lines_add(&st,"%s = 0",expr);
  if(fx_poly_iszero(eq))fx_lines_add(&st,"Tous les x du domaine sont solutions.");
  else {
    double roots[FX_ROOTS];int n=fx_roots(eq,roots,FX_ROOTS);
    if(n<0)fx_lines_add(&st,"Equation degre >8: non resolue automatiquement.");
    else if(!n)fx_lines_add(&st,"Aucune solution reelle.");
    else {
      fx_lines_add(&st,"4. Solutions (approx.):");
      for(int i=0;i<n;i++) {
        double den=fx_poly_eval(fx_current.b,roots[i]);
        if(fabs(den)<1e-7)fx_lines_add(&st,"x=%.8g exclu (D=0)",roots[i]);
        else fx_lines_add(&st,"x=%.8g",roots[i]);
      }
    }
  }
  fx_steps_view("RESOUDRE EQUATION",&st);
}
static void fx_output_sign(bool variations) {
  static FxSteps st; memset(&st,0,sizeof(st));fx_append_function(&st);
  FxRat target=variations?fx_rat_der(fx_current):fx_current;
  if(!target.ok){fx_lines_add(&st,"Expression trop complexe.");fx_steps_view("ETUDE",&st);return;}
  if(variations) {
    char d[220];fx_strrat(target,d,sizeof(d));
    fx_lines_add(&st,"1. Derivee f'(x)=%s",d);
    fx_lines_add(&st,"2. Chercher signe de f'(x).");
  }else fx_lines_add(&st,"1. Etudier le signe de f(x).");
  double roots[FX_ROOTS],poles[FX_ROOTS],cuts[FX_ROOTS*2];
  int rn=fx_roots(target.a,roots,FX_ROOTS),pn=fx_roots(fx_current.b,poles,FX_ROOTS);
  if(rn<0||pn<0){fx_lines_add(&st,"Degre trop grand pour un tableau exact.");fx_steps_view("ETUDE DE SIGNE",&st);return;}
  int n=0;
  fx_lines_add(&st,"3. Zeros:");
  if(!rn)fx_lines_add(&st,"aucun zero reel");
  for(int i=0;i<rn;i++) {
    if(fabs(fx_poly_eval(fx_current.b,roots[i]))<1e-6)continue;
    fx_lines_add(&st,"x=%.7g",roots[i]);fx_root_add(cuts,&n,FX_ROOTS*2,roots[i]);
  }
  fx_lines_add(&st,"4. Valeurs interdites:");
  if(!pn)fx_lines_add(&st,"aucune");
  for(int i=0;i<pn;i++) {fx_lines_add(&st,"x=%.7g",poles[i]);fx_root_add(cuts,&n,FX_ROOTS*2,poles[i]);}
  fx_lines_add(&st,"5. Signe sur intervalles:");
  for(int i=0;i<=n && i<FX_ROOTS;i++) {
    double x;
    if(n==0)x=0;
    else if(i==0)x=cuts[0]-fmax(1.,fabs(cuts[0])+1.);
    else if(i==n)x=cuts[n-1]+fmax(1.,fabs(cuts[n-1])+1.);
    else x=(cuts[i-1]+cuts[i])/2.;
    bool ok;double v=fx_rat_eval(target,x,&ok);
    if(!ok){fx_lines_add(&st,"Signe indecis entre racines.");continue;}
    if(n==0)fx_lines_add(&st,"R: %c",v>1e-10?'+':(v<-1e-10?'-':'0'));
    else if(i==0)fx_lines_add(&st,"x < %.6g: %c",cuts[0],v>1e-10?'+':(v<-1e-10?'-':'0'));
    else if(i==n)fx_lines_add(&st,"x > %.6g: %c",cuts[n-1],v>1e-10?'+':(v<-1e-10?'-':'0'));
    else fx_lines_add(&st,"%.5g < x < %.5g: %c",cuts[i-1],cuts[i],v>1e-10?'+':(v<-1e-10?'-':'0'));
    if(variations)fx_lines_add(&st,"  f %s",v>1e-10?"croissante":(v<-1e-10?"decroissante":"constante"));
  }
  if(variations) {
    fx_lines_add(&st,"Rappel: f'>0 => monte");
    fx_lines_add(&st,"f'<0 => descend");
    for(int i=0;i<rn;i++) {
      bool ok;double f=fx_rat_eval(fx_current,roots[i],&ok);
      if(ok)fx_lines_add(&st,"f(%.6g)=%.7g",roots[i],f);
    }
  }
  fx_steps_view(variations?"VARIATIONS":"SIGNE DE f(x)",&st);
}
static void fx_all(void) {
  const char *m[]={"f'(x) + methode","Limite en +inf / -inf","Limite en a","Tangente en a","Equation f(x)=b","Variations"};
  for(;;) {
    int c=list_menu("CHOISIR UN CALCUL",m,6);
    if(c<0)return;
    if(c==0)fx_output_derivative();
    else if(c==1)fx_limit_inf();
    else if(c==2)fx_limit_at();
    else if(c==3)fx_output_tangent();
    else if(c==4)fx_output_equation();
    else fx_output_sign(true);
    if(g_exit_app)return;
  }
}
static void fx_solver(void) {
  const char *starter[]={"Entrer f(x) avec les touches","Exemple: 2x^2-5x+3","Exemple: (2x+3)/(x-1)","Exemple: x(x-3)^2","Aide clavier / syntaxe"};
  if(!fx_has_function) {
    for(;;) {
      int c=list_menu("RESOUDRE EXERCICE",starter,5);if(c<0)return;
      if(c==4) {
        const char *lines[]={"XNT = x","x^y = ^","x^2 = carre","( ) = parentheses","/ = fraction; * = produit","2x = 2*x (auto)","Exposants entiers -9 a 9","sin, ln, racine non inclus","EXE pour valider f(x)"};
        message("SAISIR f(x)",lines,9);continue;
      }
      if(c==0) {fx_expr[0]=0;if(fx_input(fx_expr,sizeof(fx_expr)))continue;}
      else if(c==1)snprintf(fx_expr,sizeof(fx_expr),"2x^2-5x+3");
      else if(c==2)snprintf(fx_expr,sizeof(fx_expr),"(2x+3)/(x-1)");
      else snprintf(fx_expr,sizeof(fx_expr),"x(x-3)^2");
      char error[96];FxRat result=fx_parse(fx_expr,error,sizeof(error));
      if(!result.ok) {
        const char *lines[]={"La formule n'est pas reconnue.",error,"Verifie les parentheses et ^.","Ex: (2x+3)/(x-1)"};
        message("FORMULE NON VALIDE",lines,4);continue;
      }
      fx_current=result;fx_has_function=true;break;
    }
  }
  for(;;) {
    char current[75];snprintf(current,sizeof(current),"f(x): %.55s",fx_expr);
    const char *items[]={current,"Calculer f(a)","Calculer f'(x)","Tangente en x=a","Limite en x=a","Limite en +/-inf","Resoudre f(x)=b","Tableau de signe","Tableau de variations","Changer f(x)","Aide des touches"};
    int c=list_menu("RESOUDRE EXERCICE",items,11);
    if(c<0)return;
    if(c==0) {
      static FxSteps st; memset(&st,0,sizeof(st));fx_append_function(&st);
      char n[220],d[220];fx_strpoly(fx_current.a,n,sizeof(n));fx_strpoly(fx_current.b,d,sizeof(d));
      fx_lines_add(&st,"f(x)=N(x)/D(x)");fx_lines_add(&st,"N(x)=%s",n);fx_lines_add(&st,"D(x)=%s",d);
      fx_steps_view("FONCTION ACTUELLE",&st);
    }else if(c==1)fx_output_value();
    else if(c==2)fx_output_derivative();
    else if(c==3)fx_output_tangent();
    else if(c==4)fx_limit_at();
    else if(c==5)fx_limit_inf();
    else if(c==6)fx_output_equation();
    else if(c==7)fx_output_sign(false);
    else if(c==8)fx_output_sign(true);
    else if(c==9) {fx_has_function=false;fx_expr[0]=0;return;}
    else {
      const char *lines[]={"XNT = x","^ = touche x^y","Touche carre = ^2","EXE = valider","BACK = annuler","(2x+3)/(x-1) OK","2x, x(x-3)^2 OK","sin, ln, sqrt non inclus"};
      message("MODE D'EMPLOI",lines,8);
    }
    if(g_exit_app)return;
  }
}
