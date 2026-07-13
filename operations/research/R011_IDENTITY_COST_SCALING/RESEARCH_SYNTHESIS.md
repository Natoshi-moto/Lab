# R011 research synthesis — identity cost scaling

## Executive conclusion

The surviving public evidence does not identify one universal scaling exponent for producing and maintaining `N` aged, credible and mutually independent online identities.

The most defensible present conclusion is **regime dependence**:

- initial acquisition, content production and routine maintenance can exhibit economies of scale;
- marketplaces and recruited workers can externalize earlier ageing and credibility costs;
- maintaining behavioural distinctness, independent relationship graphs and quality control becomes harder as a coordinated population grows;
- shared infrastructure, timing and operating practices create correlated detection and loss risk;
- thresholds imposed by platform controls can change the marginal-cost regime abruptly.

This is an **INFERRED leading candidate**, not a demonstrated law.

## What the evidence directly establishes

### 1. Established accounts have heterogeneous observable market value

Beluri et al. observed 38,253 advertisements across 11 account marketplaces and reported more than USD 64 million in advertised value, with a median advertised price of USD 157. The result shows that account history and attributes can carry economic value and that a zero-cost assumption is false for traded established accounts.

It does not reveal true transaction prices, production costs, mutual independence or the exponent of cost with population size.

### 2. Large Sybil populations are operationally possible

Yang et al. studied more than 100,000 detected Sybil accounts and hundreds of thousands of platform-caught accounts on Renren. Large populations can therefore be produced, and they need not remain isolated from ordinary social graphs.

This constrains any claim that raw identity count is inherently superlinear. It does not show that the identities were aged, credible or independent, nor does it measure operator resources.

### 3. Credibility can be recruited rather than manufactured centrally

Zheng et al. documented elite Sybil attacks that recruited organically highly rated users. This demonstrates a hybrid market structure: an organizer can purchase or commission activity from pre-existing credible identities instead of paying the full historical cost of creating them.

That mechanism can create sublinear organizer-facing cost while externalizing cost to workers and prior account history. It does not imply that system-wide production cost is sublinear.

### 4. Scale creates detectable correlation

Studies of coordinated and state-linked accounts report shared temporal, linguistic, interaction and creation patterns. These observations support a mechanism in which common production processes reduce effective independence and increase correlated detection risk.

They do not directly measure the cost of eliminating those correlations.

### 5. Quantity and credible influence are distinct outputs

Public disruption evidence and the academic studies consistently distinguish account count from authentic reach, credibility or durable influence. Cheap creation of many low-quality accounts therefore measures only one region of the target problem.

## Competing explanations

### H1 — linear

Constant marginal cost remains plausible where standardized labour or purchased accounts dominate and quality requirements remain fixed.

Evidence needed to support it:

- comparable identities across multiple scales;
- stable operator hours and spend per identity;
- stable suspension and replacement rates;
- stable graph and behavioural independence metrics.

### H2 — sublinear

Economies of scale are plausible through automation, bulk acquisition, reusable infrastructure, organizational learning and distributed labour markets.

The major threat to this interpretation is target substitution: falling cost may reflect lower credibility, less independence or higher correlated risk.

### H3 — superlinear

Rising marginal cost is plausible when behavioural differentiation, graph independence, quality assurance or expected correlated loss dominates.

The current literature supplies mechanisms and correlation observations, but no calibrated cost curve.

### H4 — regime-dependent

This family best accommodates all observed mechanisms:

1. fixed setup and automation produce early economies of scale;
2. bulk acquisition or recruitment lowers organizer-facing marginal cost;
3. quality, independence and behavioural coherence become bottlenecks;
4. platform thresholds and correlated compromise steepen marginal cost or cause discontinuous losses.

This family is currently the leading candidate because it explains both cheap large populations and the observed difficulty of preserving independence and influence.

## Falsification conditions

The regime-dependent candidate would be weakened by evidence that operators can sustain large populations of aged, high-credibility, low-correlation identities while maintaining approximately constant or falling marginal total resources and stable survival.

A universal superlinear claim would be weakened by verified large-scale operations with comparable output quality and constant marginal resources.

A universal sublinear claim would be weakened if apparent economies disappear after controlling for credibility, history, independent graphs, behavioural distinctness, suspension risk and replacement.

A universal linear claim would be weakened by robust change points or rising quality-controlled marginal labour and correlated-loss exposure.

## Missing decisive evidence

A useful empirical dataset must jointly record:

- identity population size;
- age and history requirements;
- acquisition and infrastructure spend;
- human operator hours;
- behavioural similarity;
- graph independence;
- platform and verification conditions;
- suspension or compromise rates;
- correlated-loss events;
- replacement cost;
- achieved reach or task success.

Without these fields, fitting a power law risks measuring account quantity while silently dropping the defining qualities of the research target.

## Disposition

- Universal linear law: **UNVERIFIED**
- Universal sublinear law: **UNVERIFIED**
- Universal superlinear law: **UNVERIFIED**
- Regime-dependent model: **CANDIDATE / INFERRED**
- Exact exponent: **CANNOT YET BE DECIDED**
- Value of the research: **DEMONSTRATED as an evidence-gap and experiment-design result**, not as empirical calibration
