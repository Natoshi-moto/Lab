# R011 identity-cost scaling model specification

## Question

How does the total and marginal cost of producing and maintaining `N` mutually independent, aged and credible online identities scale with `N`?

The model is not a recipe for operating identities. It is a defensive abstraction for comparing hypotheses and identifying missing evidence.

## Cost dimensions

Nexus must not collapse all burden into one monetary number. The model tracks a weighted aggregate of:

- creation and acquisition cost;
- ageing and maintenance cost;
- behavioural differentiation cost;
- independent social or transactional graph cost;
- platform-control and verification pressure;
- human attention and quality-control burden;
- expected correlated-loss cost;
- recovery and replacement cost.

Weights are scenario assumptions, not measured constants unless backed by evidence.

## General form

For identity count `N >= 0`:

```text
C(N) = F
     + a * N^alpha_creation
     + m * N^alpha_maintenance
     + b * N^alpha_behaviour
     + g * N^alpha_graph
     + q * N^alpha_quality
     + L * N * p_correlated(N)
     + T(N)
```

Where:

- `F` is fixed setup cost;
- component coefficients are non-negative;
- each exponent encodes economies or diseconomies of scale;
- `p_correlated(N)` is the probability or rate of correlated compromise attributable to shared infrastructure or detectable similarity;
- `L` is expected replacement/loss severity per exposed identity;
- `T(N)` is an optional threshold term for verification or detection-regime changes.

The model returns normalized cost units unless coefficients are empirically calibrated.

## Competing families

### H1 — linear

All material exponents equal `1`, correlated loss is absent or constant per identity, and no threshold is crossed.

Prediction: marginal cost remains approximately constant.

Potential falsifier: robust evidence that quality-controlled marginal labour, graph independence or correlated-risk cost rises materially with scale after controlling for account quality.

### H2 — sublinear

At least one dominant component has exponent below `1`, representing automation, shared infrastructure, bulk acquisition or organizational learning.

Prediction: average cost falls with `N` over the observed range.

Potential falsifier: evidence that low-cost scale is achieved only by sacrificing credibility or independence, so the measured output is not the target object.

### H3 — superlinear

One or more dominant components have exponent above `1`, especially behavioural differentiation, graph independence, quality control or correlated-risk exposure.

Prediction: marginal cost increases with `N` even before catastrophic loss.

Potential falsifier: observed operators sustaining large high-credibility, low-correlation identity sets at roughly constant marginal resource cost.

### H4 — regime-dependent

Early production is sublinear or linear due to automation and shared fixed costs, but a threshold produces steeper marginal cost or correlated failure.

Prediction: cost curves show one or more change points rather than one stable exponent.

Potential falsifier: broad empirical evidence for a stable exponent across small, medium and large operations under comparable quality requirements.

## Central conceptual distinction

The research target is not merely `N accounts`.

It is approximately:

```text
N identities
x credibility
x age/history
x behavioural distinctness
x graph independence
x survival probability
```

Cheap production of numerous low-quality accounts is therefore evidence about one region of the problem, not a measurement of the full target.

## Initial inference

The current evidence does not justify one universal exponent.

A provisional regime-dependent model is the leading candidate because:

- automation and marketplaces can lower initial marginal acquisition or content cost;
- credible aged accounts can be recruited or purchased, externalizing prior maintenance cost;
- scaled operations display behavioural, temporal and graph correlations;
- correlation creates detection and expected-loss terms that can rise with scale;
- credibility and influence do not necessarily rise with raw account count.

This is `INFERRED`, not `DEMONSTRATED`.

## Required empirical calibration

A future experiment or dataset should measure, at minimum:

- identity count;
- age and history requirements;
- independent relationship-graph quality;
- behavioural similarity metrics;
- human operator hours;
- infrastructure and acquisition spend;
- suspension or compromise rate;
- correlated-loss events;
- replacement cost;
- achieved reach or task success.

Without these variables, fitting a single power law risks measuring account quantity while silently dropping credibility and independence.
