import{cu as je,o4 as We,d9 as Ne,ey as ze,bU as Ge,bV as Me,A as qe,v7 as Ze,Ga as re,m as Qe,b0 as Ye,mM as Xe,Du as S,Dm as oe,ez as Je,n$ as pe,uS as le,Gb as fe,Ft as Ke,Dw as X,E3 as et,EG as me,Gc as _e,E1 as ve,FT as tt,Dp as at,Dt as st,Fo as Ie,Dx as se,Dy as U,Dz as j,j as W,Fv as N,DA as Z,E6 as Oe,DE as ce,Gd as it,FK as ke,FV as nt,_ as z,DN as ge,Fw as rt,aD as A,f5 as ot,FQ as xe,e7 as lt,l as ie,Fh as J,kz as ct,kF as ye,fd as ut,dH as we,f8 as ht,au as K,fi as dt,xS as pt,eT as be,mq as ft,Ea as mt,lE as _t,mI as vt,Ge as gt,dJ as xt,fT as yt,Gf as wt,e as Fe,ei as bt,pL as Pt,a9 as St,pN as Ct,i6 as Pe,q0 as Tt,dP as Dt,pM as At,bd as $t,xu as zt,bp as Gt,dx as Mt,Gg as qt,bl as It,oE as Ot,mO as kt,cf as Ft,d as ee}from"./index-BhvrJzyQ.js";import{_ as Rt}from"./tiles3DUtils-DyRq2PfH.js";import{l as Et}from"./LayerView3D-DkTS2I-Y.js";import{d as Ht}from"./LayerView-BE6xci74.js";let Bt=class extends je{constructor(e,t,a,n){super(e,0,0,0,t),this.cachedNodes=a,this.memoryMBCached=n}};const T=4096,Re=16,O=1023,k=O+1,Vt=T*Re/k,V=4,Ee=k*V,Se=O*V;let Lt=class{constructor(e=Vt){this._pageCount=e;const t=Math.ceil(e/32);this._bitset=new Uint32Array(t)}get pageCount(){return this._pageCount}isAllocated(e){const t=e/32|0,a=e%32;return!!(this._bitset[t]&1<<a)}allocate(e){const t=e/32|0,a=e%32;this._bitset[t]|=1<<a}free(e){const t=e/32|0,a=e%32;this._bitset[t]&=~(1<<a)}findFirstFreePage(){for(let e=0;e<this._bitset.length;e++)if(this._bitset[e]!==4294967295)for(let t=0;t<32;t++){const a=32*e+t;if(a>=this._pageCount)break;if(!(this._bitset[e]&1<<t))return a}return null}resize(e){this._pageCount=e;const t=Math.ceil(e/32),a=this._bitset.length;if(t!==a){const n=new Uint32Array(t),i=Math.min(a,t);n.set(this._bitset.subarray(0,i)),this._bitset=n}this._clearExcessBits(this._bitset,e)}_clearExcessBits(e,t){const a=Math.floor((t-1)/32),n=(t-1)%32;if(t>0&&n<31){const i=(1<<n+1)-1;e[a]&=i}a+1<e.length&&e.fill(0,a+1)}};class Ut{constructor(e,t,a,n,i,c,u){this.handle=e,this.obb=t,this.gaussianAtlasIndices=a,this.pageIds=n,this.positions=i,this.squaredScales=c,this.maxScale=u,this.isVisible=!1,this.usedMemory=We(this.gaussianAtlasIndices,this.positions,this.squaredScales)+this.pageIds.length*Ee*4}}class jt extends Ne{constructor(e){super("GaussianSplatSortWorker","sort",{sort:t=>[t.distances.buffer,t.sortOrderIndices.buffer]},e,{strategy:"dedicated"})}sort(e,t){return this.invokeMethod("sort",e,t)}async destroyWorkerAndSelf(){await this.broadcast({},"destroy"),this.destroy()}}let Wt=class{constructor(e){this.texture=null,this._orderTextureCapacity=0,this._rctx=e}ensureCapacity(e){if(this._orderTextureCapacity<e){this.texture?.dispose();const t=Math.ceil(e*re),a=this._evalTextureSize(t),n=a[0]*a[1];this._orderBuffer=new Uint32Array(n);const i=new ze;i.height=a[0],i.width=a[1],i.pixelFormat=36244,i.dataType=Ge.UNSIGNED_INT,i.internalFormat=Me.R32UI,i.wrapMode=33071,i.samplingMode=9728,this.texture=new qe(this._rctx,i),this._orderTextureCapacity=n}}setData(e,t){this.ensureCapacity(t),this._orderBuffer?.set(e),this.texture?.setData(this._orderBuffer)}clear(){this._orderTextureCapacity=0,this.texture?.dispose(),this.texture=null}destroy(){this.texture?.dispose()}_evalTextureSize(e){const t=Math.ceil(Math.sqrt(e)),a=Math.ceil(e/t);return Ze(t,a)}},Nt=class{constructor(e,t,a){this._splatAtlasTextureHeight=Re,this.texture=null,this._rctx=e,this._fboCache=a,this.pageAllocator=new Lt,this._cache=t.newCache("gaussian texture cache",n=>n.dispose())}ensureTextureAtlas(){if(this.texture)return;const e=this._cache.pop("splatTextureAtlas");if(e)return void(this.texture=e);const t=new ze;t.height=this._splatAtlasTextureHeight,t.width=T,t.pixelFormat=36249,t.dataType=Ge.UNSIGNED_INT,t.internalFormat=Me.RGBA32UI,t.samplingMode=9728,t.wrapMode=33071,this.texture=new qe(this._rctx,t),this._updatePageAllocator()}grow(){if(!this.texture)return this.ensureTextureAtlas(),!1;const e=Math.floor(this._splatAtlasTextureHeight*re);if(e*T>this._rctx.parameters.maxPreferredTexturePixels)return!1;const t=new Qe(this._rctx,this.texture),a=this._fboCache.acquire(T,e,"gaussian splat atlas resize",11);return this._rctx.blitFramebuffer(t,a.fbo,16384,9728,0,0,T,this._splatAtlasTextureHeight,0,0,T,this._splatAtlasTextureHeight),this.texture?.dispose(),this.texture=a.fbo?.detachColorTexture(),t.dispose(),a.dispose(),this._splatAtlasTextureHeight=e,this._updatePageAllocator(),!0}requestPage(){let e=this.pageAllocator.findFirstFreePage();return e===null&&this.grow()&&(e=this.pageAllocator.findFirstFreePage()),e!==null&&this.pageAllocator.allocate(e),e}freePage(e){this.pageAllocator.free(e)}update(e,t,a){this.ensureTextureAtlas(),this.texture.updateData(0,e,t,k,1,a)}_updatePageAllocator(){const e=T*this._splatAtlasTextureHeight/k;this.pageAllocator.pageCount!==e&&this.pageAllocator.resize(e)}clear(){this.texture&&(this._cache.put("splatTextureAtlas",this.texture),this.texture=null)}destroy(){this._cache.destroy(),this.texture?.dispose()}},Zt=class{constructor(e){this._updating=Ye(!1),this.visibleGaussians=0,this._visibleGaussianTiles=new Array,this._workerHandle=null,this._isSorting=!1,this._pendingSortTask=!1,this._bufferCapacity=0,this._renderer=e,this._orderTexture=new Wt(this._renderer.renderingContext),this._textureAtlas=new Nt(this._renderer.renderingContext,this._renderer.view.resourceController.memoryController,this._renderer.fboCache);const{resourceController:t}=this._renderer.view;this._workerHandle=new jt(Xe(t))}get textureAtlas(){return this._textureAtlas}get orderTexture(){return this._orderTexture}get visibleGaussianTiles(){return this._visibleGaussianTiles}updateGaussianVisibility(e){this._visibleGaussianTiles=e,this.requestSort()}isUpdating(){return this._updating.value}destroy(){this._pendingSortTask=!1,this._workerHandle?.destroyWorkerAndSelf(),this._textureAtlas.destroy(),this._orderTexture.destroy()}requestSort(){this._updating.value=!0,this._isSorting?this._pendingSortTask=!0:(this._isSorting=!0,this._pendingSortTask=!1,this._sortOnWorker().then(()=>this._handleSortComplete()).catch(()=>this._handleSortComplete()))}_handleSortComplete(){this._isSorting=!1,this._pendingSortTask?this.requestSort():this._updating.value=!1}_clearBuffersAndTextures(){this._bufferCapacity=0,this._orderTexture.clear(),this._textureAtlas.clear()}_ensureBufferCapacity(e){if(this._bufferCapacity<e){const t=Math.ceil(e*re);this._atlasIndicesBuffer=new Uint32Array(t),this._sortedAtlasIndicesBuffer=new Uint32Array(t),this._distancesBuffer=new Float64Array(t),this._sortOrderBuffer=new Uint32Array(t),this._bufferCapacity=t}}async _sortOnWorker(){let e=0;if(this._visibleGaussianTiles.forEach(h=>e+=h.gaussianAtlasIndices.length),e===0)return this.visibleGaussians=0,this._clearBuffersAndTextures(),void this._renderer.requestRender(1);this._ensureBufferCapacity(e),this._textureAtlas.ensureTextureAtlas();const t=this._renderer.camera.eye,a=t[0],n=t[1],i=t[2],c=this._atlasIndicesBuffer.subarray(0,e);let u=0;this._visibleGaussianTiles.forEach(h=>{const f=h.gaussianAtlasIndices,l=h.positions;for(let r=0;r<f.length;r++){c[u]=f[r];const m=3*r,w=l[m],b=l[m+1],o=l[m+2],d=w-a,v=b-n,g=o-i;this._distancesBuffer[u]=d*d+v*v+g*g,u++}});for(let h=0;h<e;h++)this._sortOrderBuffer[h]=h;const p={distances:this._distancesBuffer,sortOrderIndices:this._sortOrderBuffer,numGaussians:e,preciseSort:!1};await this._workerHandle?.sort(p).then(h=>{this._distancesBuffer=h.distances,this._sortOrderBuffer=h.sortedOrderIndices;const f=this._sortedAtlasIndicesBuffer.subarray(0,e);for(let r=0;r<e;r++)f[r]=c[h.sortedOrderIndices[r]];this._orderTexture.setData(f,e);const l=this._renderer.view.qualitySettings.gaussianSplat.maxAllowedVisibleGaussians;this.visibleGaussians=Math.min(e,l),this._renderer.requestRender(1)})}};function Qt(s){s.code.add(S`void computeCovariance3D(in mat3 rotation, in vec3 scale, out vec3 covarianceA, out vec3 covarianceB) {
mat3 scaleMatrix = mat3(
vec3(scale.x, 0.0, 0.0),
vec3(0.0, scale.y, 0.0),
vec3(0.0, 0.0, scale.z)
);
mat3 M = scaleMatrix * rotation;
mat3 covariance3D = transpose(M) * M;
covarianceA = vec3(covariance3D[0][0], covariance3D[0][1], covariance3D[0][2]);
covarianceB = vec3(covariance3D[1][1], covariance3D[1][2], covariance3D[2][2]);
}
vec3 computeCovariance2D(vec3 center, float focalLength, vec2 tanFov, float[6] cov3D, mat4 view) {
vec4 viewSpacePoint = vec4(center, 1);
vec2 max = 1.3 * tanFov;
vec2 normalized = viewSpacePoint.xy / viewSpacePoint.z;
viewSpacePoint.xy = clamp(normalized, -max, max) * viewSpacePoint.z;
float invZ = 1.0 / viewSpacePoint.z;
float invZSquared = invZ * invZ;
mat3 projectionJacobian = mat3(
focalLength * invZ,  0.0,                   -(focalLength * viewSpacePoint.x) * invZSquared,
0.0,                 focalLength * invZ,    -(focalLength * viewSpacePoint.y) * invZSquared,
0.0,                 0.0,                   0.0
);
mat3 worldToView = transpose(mat3(view));
mat3 T = worldToView * projectionJacobian;
mat3 covariance3D = mat3(
cov3D[0], cov3D[1], cov3D[2],
cov3D[1], cov3D[3], cov3D[4],
cov3D[2], cov3D[4], cov3D[5]
);
mat3 covariance2D = transpose(T) * transpose(covariance3D) * T;
const float regularization = 0.3;
covariance2D[0][0] += regularization;
covariance2D[1][1] += regularization;
return vec3(covariance2D[0][0], covariance2D[0][1], covariance2D[1][1]);
}`)}function Yt(s){s.code.add(S`vec4 unpackColor(uvec4 packedGaussian) {
vec4 color;
color.r = float((packedGaussian.w >> 1u) & 0xfeu);
color.g = float((packedGaussian.w >> 9u) & 0xffu);
color.b = float((packedGaussian.w >> 16u) & 0xfeu);
color.a = float((packedGaussian.w >> 24u) & 0xffu);
return color / 255.0;
}`),s.code.add(S`vec3 unpackScale(uvec4 packedGaussian) {
uint sx = (packedGaussian.z >> 10u) & 0xffu;
uint sy = (packedGaussian.z >> 18u) & 0xffu;
uint szLow = (packedGaussian.z >> 26u) & 0x3fu;
uint szHigh = packedGaussian.a & 0x3u;
uint sz = szLow | (szHigh << 6u);
return exp(vec3(sx, sy, sz) / 16.0 - 10.0);
}`),s.code.add(S`const uint MASK_9_BITS = 0x1FFu;
const float SQRT_HALF = 0.7071067811865476;
const ivec3 COMPONENT_ORDER[4] = ivec3[4](
ivec3(3, 2, 1),
ivec3(3, 2, 0),
ivec3(3, 1, 0),
ivec3(2, 1, 0)
);
vec4 unpackQuaternion(uvec4 packedGaussian) {
uint packedRotation = packedGaussian.x;
uint largestComponent = packedRotation >> 30u;
vec4 quaternion = vec4(0.0);
float sumSquares = 0.0;
uint bitfield = packedRotation;
for (int j = 0; j < 3; ++j) {
int index = COMPONENT_ORDER[int(largestComponent)][j];
uint magnitude = bitfield & MASK_9_BITS;
uint signBit = (bitfield >> 9u) & 1u;
bitfield = bitfield >> 10u;
float value = SQRT_HALF * float(magnitude) / float(MASK_9_BITS);
quaternion[index] = signBit == 1u ? -value : value;
sumSquares += value * value;
}
quaternion[int(largestComponent)] = sqrt(1.0 - sumSquares);
return quaternion;
}`),s.code.add(S`vec3 unpackTileOriginRelativePosition(uvec4 packedGaussian) {
uint packedPositionLow = packedGaussian.y;
uint packedPositionHigh = packedGaussian.z;
uint x = packedPositionLow & 0x3FFFu;
uint y = (packedPositionLow >> 14u) & 0x3FFFu;
uint zLow = (packedPositionLow >> 28u) & 0xFu;
uint zHigh = packedPositionHigh & 0x3FFu;
uint z = zLow | (zHigh << 4u);
return vec3(float(x), float(y), float(z));
}`),s.code.add(S`vec3 unpackCameraRelativeGaussianPosition(uvec4 packedHeader, highp vec3 position, vec3 cameraPosition, vec3 cameraPos8k, vec3 cameraDelta) {
vec3 tileOrigin = uintBitsToFloat(packedHeader.xyz);
float invPosScale = 1.0 / exp2(float(packedHeader.w & 0xffu));
vec3 delta = tileOrigin.xyz - cameraPos8k;
vec3 cameraRelativePosition = position.xyz * invPosScale + delta * 2.048 - cameraDelta;
return cameraRelativePosition;
}`)}function Xt(s){s.code.add(S`mat3 quaternionToRotationMatrix(vec4 q) {
float x2 = q.x + q.x;
float y2 = q.y + q.y;
float z2 = q.z + q.z;
float xx = x2 * q.x;
float yy = y2 * q.y;
float zz = z2 * q.z;
float xy = x2 * q.y;
float xz = x2 * q.z;
float yz = y2 * q.z;
float wx = x2 * q.w;
float wy = y2 * q.w;
float wz = z2 * q.w;
return mat3(
1.0 - (yy + zz), xy - wz, xz + wy,
xy + wz, 1.0 - (xx + zz), yz - wx,
xz - wy, yz + wx, 1.0 - (xx + yy)
);
}`)}class ue extends oe{constructor(){super(...arguments),this.totalGaussians=-1,this.focalLength=-1,this.minSplatRadius=-1,this.minSplatOpacity=-1,this.tanFov=Je,this.cameraDelta=pe,this.cameraPos8k=pe}}function He(s){const e=new le;e.varyings.add("vColor","vec4"),e.varyings.add("conicOpacity","vec4"),e.varyings.add("depth","float"),e.varyings.add("gaussianCenterScreenPos","vec2"),e.varyings.add("fragScreenPos","vec2"),e.outputs.add("fragColor","vec4",0),e.vertex.uniforms.add(new fe("splatOrderTexture",a=>a.splatOrder),new fe("splatAtlasTexture",a=>a.splatAtlas),new Ke("numSplats",a=>a.totalGaussians),new X("focalLength",a=>a.focalLength),new X("minSplatRadius",a=>a.minSplatRadius),new X("minSplatOpacity",a=>a.minSplatOpacity),new et("tanFov",a=>a.tanFov),new me("cameraDelta",a=>a.cameraDelta),new me("cameraPos8k",a=>a.cameraPos8k),new _e("fullWidth",({camera:a})=>a.viewport[2]),new _e("fullHeight",({camera:a})=>a.viewport[3]),new ve("proj",a=>a.camera.projectionMatrix),new ve("view",a=>a.camera.viewMatrix),new tt("cameraPosition",a=>a.camera.eye)),e.vertex.include(Yt),e.vertex.include(Xt),e.vertex.include(Qt),e.include(at,s),e.vertex.code.add(S`float ndcToPixel(float ndcCoord, float screenSize) {
return ((ndcCoord + 1.0) * screenSize - 1.0) * 0.5;
}`),e.vertex.main.add(`
    uint instanceID = uint(gl_InstanceID);

    // Transform the instanceID into 2D coordinates
    uint orderTextureWidth = uint(textureSize(splatOrderTexture, 0).x);
    uint x = instanceID % orderTextureWidth;
    uint y = instanceID / orderTextureWidth;

    // Fetch the index of the remaining frontmost Gaussian
    uint gaussianIndex = texelFetch(splatOrderTexture, ivec2(x, y), 0).r;

    uint splatAtlasSize = uint(textureSize(splatAtlasTexture, 0).x);

    // Fetch the packed Gaussian according to the index
    uint gaussianIndexX = gaussianIndex % uint(splatAtlasSize);
    uint gaussianIndexY = gaussianIndex / uint(splatAtlasSize);
    uvec4 packedGaussian = texelFetch(splatAtlasTexture, ivec2(gaussianIndexX, gaussianIndexY), 0);

    // Fetch the header associated with the packed Gaussian (contains tile origin and number of fractional bits)
    uint pageNum = gaussianIndex / 1024u;
    uint headerIndex = (pageNum + 1u) * 1024u - 1u;
    uint headerIndexX = headerIndex % uint(splatAtlasSize);
    uint headerIndexY = headerIndex / uint(splatAtlasSize);
    uvec4 packedHeader = texelFetch(splatAtlasTexture, ivec2(headerIndexX, headerIndexY), 0);

    // Unpack the Gaussian
    vColor = unpackColor(packedGaussian);
    // Ignore gaussians with very small contribution, with tolerance based on the quality profile
    if(vColor.a < minSplatOpacity) {
      gl_Position = vec4(1e038, 1e038, 1e038, 1.0);
      return;
    }

    vec3 scale = unpackScale(packedGaussian); 
    vec4 quaternion = unpackQuaternion(packedGaussian);
    mat3 rotation = quaternionToRotationMatrix(quaternion);
    vec3 tileOriginRelativePosition = unpackTileOriginRelativePosition(packedGaussian);

    vec3 cameraRelativePosition = unpackCameraRelativeGaussianPosition(packedHeader, tileOriginRelativePosition, cameraPosition, cameraPos8k, cameraDelta);

    vec4 viewPos = vec4(mat3(view) * cameraRelativePosition, 1);

    if (viewPos.z > 1.0) {
      gl_Position = vec4(1e038, 1e038, 1e038, 1.0);
      return;
    }

    forwardViewPosDepth(viewPos.xyz);

    vec3 covarianceA;
    vec3 covarianceB;
    computeCovariance3D(rotation, scale.xyz, covarianceA, covarianceB);

    float covariance3D[6] = float[6](covarianceA.x, covarianceA.y, covarianceA.z, covarianceB.x, covarianceB.y, covarianceB.z);

    vec3 covariance2D = computeCovariance2D(viewPos.xyz, focalLength, tanFov, covariance3D, view);
    
    // Invert covariance (EWA algorithm)
    float determinant = (covariance2D.x * covariance2D.z - covariance2D.y * covariance2D.y);
    if (determinant == 0.) {
      gl_Position = vec4(1e038, 1e038, 1e038, 1.0);
      return;
    }
    float invDeterminant = 1. / determinant;
    

    vec4 projPos = proj * viewPos;
    float invW = 1. / (projPos.w + 1e-7);
    vec3 ndcPos = projPos.xyz * invW;

    // Compute extent in screen space (by finding the eigenvalues of the 2D covariance matrix). 
    // Use the extent to compute the bounding rectangle of the Gaussian in screen space.
    float mid = 0.5 * (covariance2D.x + covariance2D.z);
    float lambda1 = mid + sqrt(max(0.1, mid * mid - determinant));
    float lambda2 = mid - sqrt(max(0.1, mid * mid - determinant));
    float radius = ceil(3. * sqrt(max(lambda1, lambda2)));
    gaussianCenterScreenPos = vec2(ndcToPixel(ndcPos.x, float(fullWidth)), ndcToPixel(ndcPos.y, float(fullHeight)));

    // Ignore gaussians with very small contribution, with tolerance based on the quality profile
    if(minSplatRadius > 0.0) {
      float effectiveSize = radius * vColor.a;
      if(effectiveSize < minSplatRadius) {
        gl_Position = vec4(1e038, 1e038, 1e038, 1.0);
        return;
      }
    }

    // This maps vertex IDs 0, 1, 2, 3 to (-1,-1), (1,-1), (-1,1), (1,1)
    vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) - 1.0;

    // Vertex (corner) position in screen space
    fragScreenPos = gaussianCenterScreenPos + radius * corner;

    // We use a conic function to derive the opacity
    vec3 conic = vec3(covariance2D.z, -covariance2D.y, covariance2D.x) * invDeterminant;
    conicOpacity = vec4(conic, vColor.a);

    depth = ndcPos.z;
    
    // Convert from screen-space to clip-space
    vec2 clipPos = fragScreenPos / vec2(fullWidth, fullHeight) * 2. - 1.;

    gl_Position = vec4(clipPos, depth, 1.0);

  `);const t=s.depthPass;return e.fragment.main.add(`
    discardByTerrainDepth();
    vec2 offsetFromCenter = gaussianCenterScreenPos - fragScreenPos;

    // Evaluate the 2D elliptical Gaussian exponent using the general conic form: Ax^2+2Bxy+Cy^2
    float x = offsetFromCenter.x;
    float y = offsetFromCenter.y;
    float A = conicOpacity.x;
    float B = conicOpacity.y;
    float C = conicOpacity.z;
    float opacityScale = conicOpacity.w;
    float gaussianExponent = -0.5 * (A * x * x + 2.0 * B * x * y + C * y * y);

    // A positive exponent indicates alpha > 1, this should not happen
    if (gaussianExponent > 0.0) {
      discard;
    }

    float gaussianFalloff = exp(gaussianExponent);
    
      // cap at 0.99 to avoid blending issues, such as seams between overlapping Gaussians
    float alpha = min(.99f, opacityScale * gaussianFalloff);

    // discard low alpha fragments since their contribution would not be visible
    if (alpha < 1./255.) {
        discard;
    }

    // We cannot write color and depth in the same pass, as they require different blend modes.
    // Regular depth writing based on first hit is not precise enough due to the inherently 
    // transparent nature of Gaussian Splats (especially at the borders of the Splat).
    // We thus use a blended depth that computes a non-linear average using 
    // the splat order and opacity with geometric decay.
    // This means the depth is averaged based on the order and opacity of the Gaussians,
    // with the frontmost Gaussians contributing the most.
    ${st(t,"fragColor = vec4(depth, 0, 0, alpha);","fragColor = vec4(vColor.rgb * alpha, alpha);")}
  `),e}const Be=Object.freeze(Object.defineProperty({__proto__:null,GaussianSplatPassParameters:ue,build:He},Symbol.toStringTag,{value:"Module"}));let he=class extends oe{};function Ve(){const s=new le;return s.include(Ie),s.fragment.uniforms.add(new se("colorTexture",e=>e.color),new se("splatOutputColor",e=>e.splatColor)),s.fragment.main.add(S`vec4 color = texture(colorTexture, uv);
vec4 splatColor = texture(splatOutputColor, uv);
fragColor = splatColor + color * (1.0 - splatColor.a);`),s}const Jt=Object.freeze(Object.defineProperty({__proto__:null,GaussianSplatCompositionPassParameters:he,build:Ve},Symbol.toStringTag,{value:"Module"}));let Ce=class extends U{constructor(e,t){super(e,t,new j(Jt,()=>W(()=>Promise.resolve().then(()=>ea),void 0)),N)}initializePipeline(){return Z({colorWrite:ce,depthTest:null,depthWrite:Oe})}},de=class extends oe{};function Le(){const s=new le;return s.include(Ie),s.fragment.uniforms.add(new se("splatOutputDepth",e=>e.splatDepth)),s.fragment.main.add(S`vec4 splatDepth = texture(splatOutputDepth, uv);
float ndcDepth = splatDepth.x;
float depthCutOff = 0.75;
if(splatDepth.a < depthCutOff) {
discard;
}
gl_FragDepth = (ndcDepth + 1.0) * 0.5;`),s}const Kt=Object.freeze(Object.defineProperty({__proto__:null,GaussianSplatDepthCompositionPassParameters:de,build:Le},Symbol.toStringTag,{value:"Module"}));let Te=class extends U{constructor(e,t){super(e,t,new j(Kt,()=>W(()=>Promise.resolve().then(()=>ta),void 0)),N)}initializePipeline(){return Z({colorWrite:null,depthTest:{func:515},depthWrite:Oe,drawBuffers:{buffers:[it]}})}},De=class extends U{constructor(e,t){super(e,t,new j(Be,()=>W(()=>Promise.resolve().then(()=>Ue),void 0)),N)}_createPipeline(){return Z({blending:ke(773,773,772,1,32774,32774),depthTest:{func:513},colorWrite:ce})}initializePipeline(){return this._createPipeline()}};class Ae extends U{constructor(e,t){super(e,t,new j(Be,()=>W(()=>Promise.resolve().then(()=>Ue),void 0)),N)}_createPipeline(){return Z({blending:ke(773,773,1,1,32774,32774),depthTest:{func:515},colorWrite:ce})}initializePipeline(){return this._createPipeline()}}class L extends nt{constructor(e=!1){super(),this.terrainDepthTest=!1,this.cullAboveTerrain=!1,this.occlusionPass=!1,this.depthPass=e}}z([ge()],L.prototype,"terrainDepthTest",void 0),z([ge()],L.prototype,"cullAboveTerrain",void 0);var B,G;let ne=(G=class extends rt{constructor(){super(...arguments),this.gaussianPosition=A(),this.intersectionRayDir=A(),this.intersectionPlane=ot(),this._slicePlaneEnabled=!1,this._data=null,this.produces=xe.OPAQUE,this.type=0,this.isGround=!1,this.layerViewUid="",this._gaussianSplatParameters=new ue,this._gaussianSplatCompositionParameters=new he,this._gaussianSplatDepthCompositionParameters=new de,this._splatTechniqueConfiguration=new L,this._splatDepthTechniqueConfiguration=new L(!0),this._previousCameraPosition=A(),this._previousCameraDirection=A(),this._tanFov=lt(),this._tempVec=A(),this._cameraDelta=A(),this._coarseCameraPosition=A()}async initialize(){this._data=new Zt(this),this.view.sceneIntersectionHelper.addIntersectionHandler(this),this.addHandles([ie(()=>this.view.state.camera,()=>this._onCameraChange())])}precompile(){this._splatTechniqueConfiguration.terrainDepthTest=this.bindParameters.terrainDepthTest,this.techniques.precompile(Ae,this._splatTechniqueConfiguration),this._splatDepthTechniqueConfiguration.terrainDepthTest=this.bindParameters.terrainDepthTest,this.techniques.precompile(De,this._splatDepthTechniqueConfiguration),this.techniques.precompile(Ce),this.techniques.precompile(Te)}render(e){const t=e.find(({name:g})=>g===xe.OPAQUE);if(!this._data.visibleGaussians||!this._data.orderTexture.texture||!this._data.textureAtlas.texture)return t;const a=this.techniques.get(Ae,this._splatTechniqueConfiguration),n=this.techniques.get(De,this._splatDepthTechniqueConfiguration),i=this.techniques.get(Ce),c=this.techniques.get(Te);if(!(a.compiled&&n.compiled&&c.compiled&&i.compiled))return this.requestRender(1),t;const{fullWidth:u,fullHeight:p}=this.bindParameters.camera,h=this.fboCache,f=h.acquire(u,p,"gaussian color output");f.attachDepth(t.getAttachment(J));const l=this.renderingContext;l.bindFramebuffer(f.fbo),l.setClearColor(0,0,0,0),l.clear(16384),this._gaussianSplatParameters.totalGaussians=this._data.visibleGaussians,this._gaussianSplatParameters.splatOrder=this._data.orderTexture.texture,this._gaussianSplatParameters.splatAtlas=this._data.textureAtlas.texture;const r=Math.tan(.5*this.camera.fovY),m=r/p*u;ct(this._tanFov,m,r);const w=p/(2*r);this._gaussianSplatParameters.focalLength=w,this._gaussianSplatParameters.tanFov=this._tanFov;const b=this.view.qualitySettings.gaussianSplat,o=b.minimumSplatPixelRadius*Math.sqrt(u*p)/Math.sqrt(2073600);this._gaussianSplatParameters.minSplatRadius=o,this._gaussianSplatParameters.minSplatOpacity=b.minimumOpacity,this._prepareHighPrecisionCameraPosition(),this.renderingContext.bindTechnique(a,this.bindParameters,this._gaussianSplatParameters),this.renderingContext.drawArraysInstanced(ye.TRIANGLE_STRIP,0,4,this._data.visibleGaussians);const d=h.acquire(u,p,"splat depth",8);d.attachDepth(t.getAttachment(J)),l.bindFramebuffer(d.fbo),l.setClearColor(0,0,0,0),l.clear(16384),this.renderingContext.bindTechnique(n,this.bindParameters,this._gaussianSplatParameters),this.renderingContext.drawArraysInstanced(ye.TRIANGLE_STRIP,0,4,this._data.visibleGaussians);const v=h.acquire(u,p,this.produces);return this._gaussianSplatDepthCompositionParameters.splatDepth=d.getTexture(),v.attachDepth(t.getAttachment(J)),l.bindFramebuffer(v.fbo),l.bindTechnique(c,this.bindParameters,this._gaussianSplatDepthCompositionParameters),l.screen.draw(),this._gaussianSplatCompositionParameters.color=t.getTexture(),this._gaussianSplatCompositionParameters.splatColor=f.getTexture(),l.bindFramebuffer(v.fbo),l.bindTechnique(i,this.bindParameters,this._gaussianSplatCompositionParameters),l.screen.draw(),f.release(),d.release(),v}intersect(e,t,a,n){const{gaussianPosition:i,intersectionRayDir:c,intersectionPlane:u,layerViewUid:p}=this,h=ut(a,n);we(c,n,a);const f=1/ht(c);K(c,c,f);const l=A();dt(l,c),pt(u,c[0],c[1],c[2],-be(c,a));const r=new te,m=new te,w=new Array;this._data.visibleGaussianTiles.forEach(o=>{const{maxScale:d}=o,v=o.obb.minimumDistancePlane(u),g=o.obb.maximumDistancePlane(u),F=g<0,M=r.dist!=null&&m.dist!=null&&r.dist<v*f&&m.dist>g*f;if(F||M)return;const $=ft(o.obb.center,o.obb.radius+d);if(!mt($,h,null)||!o.obb.intersectRay(a,c,d))return;const{positions:_,squaredScales:x,gaussianAtlasIndices:R}=o,q=R.length;for(let D=0;D<q;D++){const P=3*D;i[0]=_[P]-a[0],i[1]=_[P+1]-a[1],i[2]=_[P+2]-a[2];const H=x[D],E=be(i,c),Q=E*E;if(_t(i)-Q>H)continue;const y=E*f,Y=C=>(C.point=C.point?C.point.fill(i[0],i[1],i[2]):yt(i),C.dist=y,C.normal=l,C.layerViewUid=p,C);if((r.dist==null||y<r.dist)&&(t==null||t(a,n,y))&&Y(r),e.options.store!==0&&(m.dist==null||y>m.dist)&&(t==null||t(a,n,y))&&Y(m),e.options.store===2&&(t==null||t(a,n,y))){const C=new te;w.push(Y(C))}}});const b=(o,d)=>{const{layerViewUid:v}=d,g=new wt(d.point,v);o.set(0,g,d.dist,d.normal)};if($e(r)){const o=e.results.min;(o.distance==null||r.dist<o.distance)&&b(o,r)}if($e(m)&&e.options.store!==0){const o=e.results.max;(o.distance==null||m.dist>o.distance)&&b(o,m)}if(e.options.store===2)for(const o of w){const d=new vt(h);b(d,o),e.results.all.push(d)}}get slicePlaneEnabled(){return this._slicePlaneEnabled}set slicePlaneEnabled(e){this._slicePlaneEnabled!==e&&(this._slicePlaneEnabled=e,this.requestRender(1))}get data(){return this._data}destroy(){this._data.destroy(),super.destroy()}_onCameraChange(){const e=this.view.state.camera.eye,t=this.view.state.camera.ray.direction,a=.001;(Math.abs(e[0]-this._previousCameraPosition[0])>a||Math.abs(e[1]-this._previousCameraPosition[1])>a||Math.abs(e[2]-this._previousCameraPosition[2])>a||Math.abs(t[0]-this._previousCameraDirection[0])>a||Math.abs(t[1]-this._previousCameraDirection[1])>a||Math.abs(t[2]-this._previousCameraDirection[2])>a)&&this._data.requestSort()}_prepareHighPrecisionCameraPosition(){K(this._tempVec,this.camera.eye,1/B.tileSize),gt(this._tempVec,this._tempVec),xt(this._coarseCameraPosition,this._tempVec),this._gaussianSplatParameters.cameraPos8k=this._coarseCameraPosition,K(this._tempVec,this._tempVec,B.tileSize),we(this._cameraDelta,this.camera.eye,this._tempVec),this._gaussianSplatParameters.cameraDelta=this._cameraDelta}},B=G,G.tileSize=2.048,G);function $e(s){return s.dist!=null&&s.point!=null}ne=B=z([Fe("esri.views.3d.webgl-engine.lib.GaussianSplatRenderNode")],ne);class te{constructor(){this.point=null,this.dist=null,this.normal=null,this.layerViewUid=""}}const ae=()=>Ft.getLogger("esri.views.3d.layers.GaussianSPlatLayerView3D");let I=class extends Et(Ht){constructor(s){super(s),this.type="gaussian-splat-3d",this._gaussianTileHandles=new Map,this._pageBuffer=new Uint32Array(Ee),this._wasmLayerId=-1,this._metersPerVCSUnit=1,this.ignoresMemoryFactor=!1,this._usedMemory=0,this._cacheMemory=0,this._useEsriCrs=!1,this.fullExtentInLocalViewSpatialReference=null,this._suspendedHandle=null,this._conversionBuffer=new ArrayBuffer(4),this._u32View=new Uint32Array(this._conversionBuffer),this._f32View=new Float32Array(this._conversionBuffer);const{view:e}=s;this._memCache=e.resourceController.memoryController.newCache(`GaussianSplat-${this.uid}`,t=>this._deleteTile(t)),this._renderNode=new ne({view:e})}initialize(){if(!this._canProjectWithoutEngine())throw bt("layer",this.layer.spatialReference.wkid,this.view.renderSpatialReference?.wkid);const s=Pt(this).then(e=>{this._wasmLayerId=e,this.addHandles([ie(()=>this.layer.elevationInfo,t=>this._elevationInfoChanged(t))]),this._suspendedHandle=ie(()=>this.suspended,t=>this._wasm?.setEnabled(this,!t),St)});this.addResolvingPromise(s)}get wasmLayerId(){return this._wasmLayerId}get metersPerVCSUnit(){return this._metersPerVCSUnit}isUpdating(){const s=this._wasm;return!(this._wasmLayerId<0||s==null)&&(s.isUpdating(this._wasmLayerId)||this._renderNode.data.isUpdating())}updatingFlagChanged(){this.notifyChange("updating")}get _wasm(){return Ct(this.view)}get usedMemory(){return this._usedMemory}get unloadedMemory(){return 0}get cachedMemory(){return this._cacheMemory}get useEsriCrs(){return this._useEsriCrs}async createRenderable(s){const e=s.meshData;if(e.data==null)throw new Error("meshData.data undefined");if(e.desc=JSON.parse(e.desc),e.desc==null)throw new Error("meshData.desc undefined");const t=e.desc.prims[0],a=t.vertexCount,n=t.atrbs[0].view,i=t.atrbs[0].view.byteCount,c=t.atrbs[0].view.byteOffset;let u=null;if(n.type!=="U32")return ae().warnOnce("unexpected meshData.data format"),{memUsageBytes:0};u=new Uint32Array(e.data.buffer,c,i/4);const p=this.extractHeader(u),h=Math.ceil(a/O),f=new Uint32Array(a),l=[];for(let _=0;_<h;_++){let x=this._data.textureAtlas.requestPage();if(x===null&&(this._freeInvisibleTiles(),x=this._data.textureAtlas.requestPage()),x===null)return ae().warnOnce("ran out of gaussian splat memory"),{memUsageBytes:0};{l.push(x);const R=a-_*O,q=Math.min(R,O),D=_*O;for(let y=0;y<q;y++)f[y+D]=y+k*x;const P=_*Se;this._pageBuffer.set(u.subarray(P,P+q*V)),this._pageBuffer.set(p.packedHeader,Se);const H=x*k,E=H%T,Q=Math.floor(H/T);this._data.textureAtlas.update(E,Q,this._pageBuffer)}}const r=new Float64Array(3*a),m=new Float64Array(a),w=2.048,b=p.tileOrigin.x*w,o=p.tileOrigin.y*w,d=p.tileOrigin.z*w,v=p.invPosScale;let g=0,F=0;for(let _=0;_<a;_++){const x=_*V,{rawX:R,rawY:q,rawZ:D}=this._extractGaussianPosition(u,x),P=this._extractGaussianSphericalScale(u,x);r[g]=R*v+b,r[g+1]=q*v+o,r[g+2]=D*v+d,m[_]=P*P,F=Math.max(F,P),g+=3}let M=null;if(e.desc.obb){const _=e.desc.obb.quaternion;M=new Pe(e.desc.obb.center,e.desc.obb.halfSize,Tt(..._))}M||(ae().warnOnce("encountered tile without a bounding box"),M=new Pe);const $=new Ut(s.handle,M,f,l,r,m,F);return this._memCache.put(`${$.handle}`,$),this._gaussianTileHandles.set(s.handle,$),this._cacheMemory+=$.usedMemory,{memUsageBytes:$.usedMemory}}_extractGaussianPosition(s,e){const t=s[e+1];return{rawX:16383&t,rawY:t>>>14&16383,rawZ:t>>>28&15|(1023&s[e+2])<<4}}_extractGaussianSphericalScale(s,e){const t=s[e+2],a=t>>>10&255,n=t>>>18&255,i=t>>>26&63|(3&s[e+3])<<6,c=Math.exp(a/16-10),u=Math.exp(n/16-10),p=Math.exp(i/16-10);return Math.max(c,u,p)}freeRenderable(s){const e=this._gaussianTileHandles.get(s);e&&(e.isVisible?this._usedMemory-=e.usedMemory:this._cacheMemory-=e.usedMemory,e.pageIds.forEach(t=>this._data.textureAtlas.freePage(t)),this.freeObject(e),this._gaussianTileHandles.delete(s)),this._updateGaussians()}freeObject(s){this._memCache.pop(`${s.handle}`)}get visibleAtCurrentScale(){return Dt(this.layer.effectiveScaleRange,this.view.scale)}setRenderableVisibility(s,e,t){for(let a=0;a<t;a++){if(!e[a])continue;const n=s[a],i=this._gaussianTileHandles.get(n);if(i){if(i.isVisible)continue;i.isVisible=!0,this._usedMemory+=i.usedMemory,this._cacheMemory-=i.usedMemory,this._memCache.pop(`${n}`)}}for(let a=0;a<t;a++){if(e[a])continue;const n=s[a],i=this._gaussianTileHandles.get(n);if(i){if(!i.isVisible)continue;i.isVisible=!1,this._usedMemory-=i.usedMemory,this._cacheMemory+=i.usedMemory,this._memCache.put(`${n}`,i)}}this._updateGaussians()}destroy(){At(this),this._suspendedHandle&&(this._suspendedHandle=$t(this._suspendedHandle)),this._renderNode.destroy(),this._memCache.destroy()}_canProjectWithoutEngine(){if(this.view.state.viewingMode===1||zt(this.view.renderSpatialReference)||Gt(this.view.renderSpatialReference))return!0;if(this.layer.esriCrsSpatialReference&&Mt(this.layer.esriCrsSpatialReference,this.view.renderSpatialReference)){const s=Rt(this.layer.esriCrsSpatialReference),e=this.view.heightModelInfo;return this._useEsriCrs=qt(s,e,!1)===0,this._useEsriCrs&&s&&(this._metersPerVCSUnit=It(1,"meters",s.heightUnit),this.fullExtentInLocalViewSpatialReference=this.layer.esriCrsFullExtent),this._useEsriCrs}return!1}_elevationInfoChanged(s){if(s?.offset)if(this._useEsriCrs){const e=Ot(s?.unit)/this._metersPerVCSUnit,t=s?.offset??0;this._wasm?.setLayerOffset(this,t*e)}else this._wasm?.setLayerOffset(this,kt(s));else this._wasm?.setLayerOffset(this,0)}_updateGaussians(){const s=new Array;for(const e of this._gaussianTileHandles.values())e.isVisible&&s.push(e);this._data.updateGaussianVisibility(s),this.notifyChange("updating")}_freeInvisibleTiles(){for(const s of this._gaussianTileHandles.values())s.isVisible||this._deleteTile(s)}get _data(){return this._renderNode.data}extractHeader(s){const e=s.length-4,t=this.reinterpretU32AsFloat(s[e]),a=this.reinterpretU32AsFloat(s[e+1]),n=this.reinterpretU32AsFloat(s[e+2]),i=1/(1<<(255&s[e+3]));return{packedHeader:s.subarray(e,e+4),tileOrigin:{x:t,y:a,z:n},invPosScale:i}}_deleteTile(s){this._wasm?.onRenderableEvicted(this,s.handle,s.usedMemory),this.freeRenderable(s.handle)}reinterpretU32AsFloat(s){return this._u32View[0]=s,this._f32View[0]}get performanceInfo(){let s=0,e=0;return this._gaussianTileHandles.forEach(t=>{t.isVisible?s++:e++}),new Bt(this.usedMemory,s,e,this.cachedMemory)}};z([ee()],I.prototype,"layer",void 0),z([ee()],I.prototype,"fullExtentInLocalViewSpatialReference",void 0),z([ee({readOnly:!0})],I.prototype,"visibleAtCurrentScale",null),I=z([Fe("esri.views.3d.layers.GaussianSplatLayerView3D")],I);const _a=I,ea=Object.freeze(Object.defineProperty({__proto__:null,GaussianSplatCompositionPassParameters:he,build:Ve},Symbol.toStringTag,{value:"Module"})),ta=Object.freeze(Object.defineProperty({__proto__:null,GaussianSplatDepthCompositionPassParameters:de,build:Le},Symbol.toStringTag,{value:"Module"})),Ue=Object.freeze(Object.defineProperty({__proto__:null,GaussianSplatPassParameters:ue,build:He},Symbol.toStringTag,{value:"Module"}));export{_a as default};
