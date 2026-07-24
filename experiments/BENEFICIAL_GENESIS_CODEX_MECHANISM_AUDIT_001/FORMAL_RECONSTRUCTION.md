# Formal reconstruction

Let fixed pool `P`, accepted contributions `x_i >= 0`, and `T=sum(x_i)`. For `T>0`, baseline allocation is `a_i=floor(P*x_i/T)` and residual `R=P-sum(a_i)`. Thus `0<=R<P` (and `R<=n-1`) and `sum(a_i)+R=P`. For `T=0`, allocation must be explicitly undefined or all-zero; the independent probe uses all-zero and leaves `P` unissued.

Exact entitlement is split-invariant: `P*(x+y)/T = P*x/T + P*y/T`. Claim-level flooring is not: `floor(z)+floor(w)<=floor(z+w)`, so splitting weakly reduces the actor's baseline units and can enlarge residuals. Linear weights preserve contribution concentration.

Concave weight `f(x)` gives a splitter `sum_j f(x_j) >= f(sum_j x_j)` for common concave functions with `f(0)=0`; the strict inequality in the executable square-root countermodel moves one actor from 1/2 to 10/11 of weight. A per-identity cap is similarly multiplied by identities. Both require an identity/collusion boundary that the permissionless receipt does not provide.

Cap-then-renormalize uses `r_i=min(x_i/T,c)` then `g_i=r_i/sum(r)`. It is not a hard cap: with one holder, `g_1=1` for every `c>0`; with `[90,10]` and `c=0.1`, final weights are `[1/2,1/2]`.

Private donor payoff is represented conditionally as `U_i=V_i+q_i*r_i*C_i-F_i-C_i`, where `V` is allocation value, `q` rebate access/enforcement, `r` rebate rate, `F` friction, and `C` opportunity cost. Net social benefit is not gross flow: `W=additional_retained-displaced_giving-taint_harm-other_externalities`. Exact sweeps contain negative, zero, and positive regions.

Extreme undersubscription is load-bearing: with any positive sole contribution, the actor receives `P`, so units per source unit scale as `P/T`. No checked rule sets a minimum denominator or makes issuance proportional to social benefit.

Transferability is orthogonal to receipt verification and initial allocation. It can support later payment, fee, security, or capital functions only if those are specified. They are not. Delayed transfer postpones market effects; non-transferable receipt preserves recognition; no-token preserves donation alone.
