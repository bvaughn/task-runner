var composite = tr.Composite();
composite.addAll([taskOne, taskTwo, taskThree]);
composite.run();

// Interrupting the Composite interrupts any of the running tasks within it.
composite.interrupt();