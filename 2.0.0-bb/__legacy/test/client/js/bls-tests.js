/*
function format(string, values) {
    for (var key in values) {
        string = string.replace(new RegExp("\{" + key + "}"), values[key]);
    }
    return string;
}
 
test("basics", function() {
    var values = {
        name: "World"
    };
    equal( format("Hello, {name}", values), "Hello, World", "single use" );
    equal( format("Hello, {name}, how is {name} today?", values),
        "Hello, World, how is World today?", "multiple" );
});
*/

define(['../../../app/static/js/main'], function() {
    require(['bls'], function (bls) {
        test('assertions', function() {  
            ok( bls !== undefined, 'one equals one');  
        });  
    });
    //test(bls);
    /*
    console.log("moduletest");
    test("sanity", function() {
        ok(true, "this test is fine");
    });

    test("the module name", function() {
      equal(SampleModule.name, "sample", "name should be sample");
    });

    test("the module purpose", function() {
      equal(SampleModule.purpose, "AMD testing", "purpose should be 'AMD testing'");
    });

    test("the module jquery version", function() {
      equal(SampleModule.jq_version, "1.6", "jq_version should be '1.6'");
    });
*/
});