# R011 adversarial review

`status_authority: NONE`

## Review target

This review attempts to defeat the provisional conclusion that identity-production cost is regime-dependent and to identify ways the model could manufacture that result from its assumptions.

## Strongest objections

### 1. The model can encode its conclusion

The supplied scenarios are transparent examples, not fitted estimates. The regime scenario contains an explicit threshold term and correlated-loss term, so it will produce a regime change by construction.

**Consequence:** model output demonstrates implementation behaviour only. It is not evidence that the real system has a threshold.

### 2. Organizer cost and total social cost are conflated

Marketplaces and recruited workers may make organizer-facing marginal cost fall while shifting ageing, maintenance and risk to sellers or workers.

**Consequence:** any empirical study must declare the cost boundary. A sublinear organizer cost can coexist with linear or superlinear total production cost.

### 3. Detection evidence is selection-biased

Most available datasets contain detected, suspended or publicly attributed operations. Successful low-correlation operations are systematically less visible.

**Consequence:** observed correlation cannot be treated as the population rate of correlation among all operations.

### 4. Credibility is not a stable scalar

Credibility differs by platform, audience, task, language, history and adversary. An identity credible enough for one action may be useless for another.

**Consequence:** a single weighted cost function may hide multiple non-substitutable constraints.

### 5. Large raw populations challenge naive superlinearity

Published datasets contain very large Sybil populations. This is strong counterevidence to claims that merely producing many accounts necessarily has rising marginal cost.

**Consequence:** any superlinear claim must be restricted to aged, credible and mutually independent identities, not accounts generally.

### 6. Bulk markets can create genuine economies

Automation, reusable infrastructure, division of labour and liquid markets can reduce marginal acquisition and maintenance cost. Quality controls may also be automated.

**Consequence:** regime dependence is not guaranteed; a broad range could remain sublinear before any threshold becomes material.

### 7. Correlated loss may be bounded or externalized

Operators may compartmentalize infrastructure, diversify suppliers or treat accounts as disposable inventory. Losses may not rise strongly with population size.

**Consequence:** correlated-loss terms need direct calibration rather than intuitive inclusion.

## Attempts to falsify each family

### Linear

A linear model fails if comparable-output marginal resources, replacement burden or quality-control labour rise systematically with scale. No current source directly establishes this.

### Sublinear

A sublinear model fails if falling unit cost disappears once identity age, graph independence, behavioural distinctness, survival and successful influence are held constant. Existing sources do not provide this controlled comparison.

### Superlinear

A universal superlinear model is contradicted by evidence that very large raw account populations and distributed worker markets exist. It survives only as a quality-constrained hypothesis.

### Regime-dependent

A regime-dependent model is broad and therefore difficult to falsify. It risks becoming an unfalsifiable catch-all unless the threshold variable, direction of change and measurable prediction are specified before observing the data.

A valid future test must pre-register:

- the output-quality floor;
- the cost boundary;
- candidate change-point variables;
- the expected direction and magnitude of marginal-cost change;
- conditions under which a stable linear or sublinear model wins.

## Implementation review

The Python artifact correctly separates fixed cost, component exponents, correlated-loss proxy and optional threshold cost. The tests show that the named scenarios exhibit their declared mathematical properties.

The artifact does not:

- estimate parameters;
- fit data;
- compare statistical model evidence;
- quantify uncertainty;
- prove logistic correlation risk;
- establish that the selected components are complete.

## Review disposition

The provisional regime-dependent interpretation is **not falsified**, but it is also **not demonstrated**. It is currently the most flexible synthesis of heterogeneous evidence and therefore must be treated cautiously.

The strongest defensible product of R011 is not an exponent. It is:

1. a clarified research target;
2. a map of competing mechanisms;
3. evidence that raw account count is an inadequate dependent variable;
4. a minimum dataset and pre-registered experiment capable of deciding more later.
