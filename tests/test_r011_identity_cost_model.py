from experiments.R011_IDENTITY_COST_SCALING.model import (
    CostParameters,
    average_cost,
    marginal_cost,
    scenario,
    total_cost,
)


def test_zero_population_has_zero_cost() -> None:
    assert total_cost(0, scenario("linear")) == 0.0


def test_linear_scenario_has_constant_marginal_cost_after_fixed_boundary() -> None:
    params = scenario("linear")
    assert marginal_cost(2, params) == marginal_cost(200, params)


def test_sublinear_scenario_average_cost_falls_over_range() -> None:
    params = scenario("sublinear")
    assert average_cost(500, params) < average_cost(10, params)


def test_superlinear_scenario_marginal_cost_rises_over_range() -> None:
    params = scenario("superlinear")
    assert marginal_cost(500, params) > marginal_cost(10, params)


def test_regime_scenario_accelerates_after_threshold() -> None:
    params = scenario("regime")
    before = marginal_cost(90, params) - marginal_cost(80, params)
    after = marginal_cost(130, params) - marginal_cost(120, params)
    assert after > before


def test_correlated_loss_increases_total_cost() -> None:
    baseline = CostParameters()
    correlated = CostParameters(
        correlated_loss_weight=3.0,
        correlation_rate=4.0,
        correlation_midpoint=100.0,
    )
    assert total_cost(200, correlated) > total_cost(200, baseline)


def test_regime_change_disappears_when_threshold_and_correlation_are_removed() -> None:
    candidate = scenario("regime")
    no_regime_mechanisms = CostParameters(
        fixed_cost=candidate.fixed_cost,
        creation_weight=candidate.creation_weight,
        maintenance_weight=candidate.maintenance_weight,
        behaviour_weight=candidate.behaviour_weight,
        graph_weight=candidate.graph_weight,
        quality_weight=candidate.quality_weight,
        alpha_creation=candidate.alpha_creation,
        alpha_maintenance=candidate.alpha_maintenance,
        alpha_behaviour=candidate.alpha_behaviour,
        alpha_graph=candidate.alpha_graph,
        alpha_quality=candidate.alpha_quality,
    )
    assert marginal_cost(150, candidate) > marginal_cost(150, no_regime_mechanisms)


def test_higher_graph_independence_exponent_raises_large_scale_marginal_cost() -> None:
    lower = CostParameters(alpha_graph=1.0)
    higher = CostParameters(alpha_graph=1.4)
    assert marginal_cost(500, higher) > marginal_cost(500, lower)


def test_negative_population_is_rejected() -> None:
    try:
        total_cost(-1, scenario("linear"))
    except ValueError as exc:
        assert "non-negative" in str(exc)
    else:
        raise AssertionError("negative population should fail")


def test_unknown_scenario_is_rejected() -> None:
    try:
        scenario("not-a-model")
    except ValueError as exc:
        assert "unknown scenario" in str(exc)
    else:
        raise AssertionError("unknown scenario should fail")
