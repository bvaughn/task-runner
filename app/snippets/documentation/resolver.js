var resolver = new tr.Resolver();
resolver.addResolution(resolutionA, [blockingConditionA, blockingConditionB]);
resolver.addResolution(resolutionB, [blockingConditionA]);
resolver.addResolution(resolutionC);
resolver.run();

// If both of the blocking conditions succeed the highest priority resolution will be chosen: resolutionA.
// If only blockingConditionA succeeds the second highest priority resolution will be chosen: resolutionB.
// If neither of the blocking conditions succeed the fallback resolution (resolutionC) will be chosen.