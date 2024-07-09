class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}
  
class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word) {
        let node = this.root;
        for (let char of word) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.isEndOfWord = true;
    }

    search(word) {
        let node = this.root;
        for (let char of word) {
            if (!node.children[char]) {
                return false;
            }
            node = node.children[char];
        }
        return node.isEndOfWord;
    }

    startsWith(prefix) {
        let node = this.root;
        for (let char of prefix) {
            if (!node.children[char]) {
                return false;
            }
            node = node.children[char];
        }
        return true;
    }

    // Serialize the trie to JSON string
    serialize() {
        return JSON.stringify(this.root);
    }

    // Deserialize a JSON string to a trie
    static deserialize(data) {
        const trie = new Trie();
        trie.root = JSON.parse(data);
        return trie;
    }
}

const dictionary = new Trie();

const wordsInserted = ["ABOMINATION","ABOMINATIONS","ABOMINATOR","ABOMINATORS","ABOON","ABORAL",
                   "ABORALLY","ABORIGINAL","ABORIGINALLY","ABORIGINALS","ABORIGINE","ABORIGINES",
                   "ABORNING","ABORT","ABORTED","ABORTER","ABORTERS","ABORTIFACIENT","ABORTIFACIENTS",
                   "ABORTING","ABORTION","ABORTIONIST","ABORTIONISTS","ABORTIONS","ABORTIVE","ABORTIVELY",
                   "ABORTIVENESS","ABORTIVENESSES","ABORTS","ABORTUS","ABORTUSES","ABOS","ABOUGHT",
                   "ABOULIA","ABOULIAS","ABOULIC","ABOUND","ABOUNDED","ABOUNDING","ABOUNDS","ABOUT",
                   "ABOVE","ABOVEBOARD","ABOVEGROUND","ABOVES","ABRACADABRA","ABRACADABRAS","ABRACHIA",
                   "ABRACHIAS","ABRADABLE","ABRADANT","ABRADANTS","ABRADE","ABRADED","ABRADER","ABRADERS",
                   "ABRADES","ABRADING","ABRASION","ABRASIONS","ABRASIVE","ABRASIVELY","ABRASIVENESS",
                   "ABRASIVENESSES","ABRASIVES","ABREACT","ABREACTED","ABREACTING","ABREACTION","ABREACTIONS",
                   "ABREACTS","ABREAST","ABRI","ABRIDGE","ABRIDGED","ABRIDGEMENT","ABRIDGEMENTS","ABRIDGER",
                   "ABRIDGERS","ABRIDGES","ABRIDGING","ABRIDGMENT","ABRIDGMENTS","ABRIS","ABROACH","ABROAD",
                   "ABROGABLE","ABROGATE","ABROGATED","ABROGATES","ABROGATING","ABROGATION","ABROGATIONS",
                   "ABROGATOR","ABROGATORS","ABROSIA","ABROSIAS","ABRUPT","ABRUPTER","ABRUPTEST","ABRUPTION",
                   "ABRUPTIONS","ABRUPTLY","ABRUPTNESS","ABRUPTNESSES","ABS","ABSCESS","ABSCESSED","ABSCESSES",
                   "ABSCESSING","ABSCISE","ABSCISED","ABSCISES","ABSCISIN","ABSCISING","ABSCISINS","ABSCISSA",
                   "ABSCISSAE","ABSCISSAS","ABSCISSION","ABSCISSIONS","ABSCOND","ABSCONDED","ABSCONDER","ABSCONDERS",
                   "ABSCONDING","ABSCONDS","ABSEIL","ABSEILED","ABSEILING","ABSEILS","ABSENCE","ABSENCES","ABSENT",
                   "ABSENTED","ABSENTEE","ABSENTEEISM","ABSENTEEISMS","ABSENTEES","ABSENTER","ABSENTERS","ABSENTING",
                   "ABSENTLY","ABSENTMINDED","ABSENTMINDEDLY","ABSENTS","ABSINTH","ABSINTHE","ABSINTHES","ABSINTHS",
                   "ABSOLUTE","ABSOLUTELY","ABSOLUTENESS","ABSOLUTENESSES","ABSOLUTER","ABSOLUTES","ABSOLUTEST","ABSOLUTION",
                   "ABSOLUTIONS","ABSOLUTISM","ABSOLUTISMS","ABSOLUTIST","ABSOLUTISTIC","ABSOLUTISTS","ABSOLUTIVE",
                   "ABSOLUTIZE","ABSOLUTIZED","ABSOLUTIZES","ABSOLUTIZING","ABSOLVE","ABSOLVED","ABSOLVENT","ABSOLVENTS",
                   "ABSOLVER","ABSOLVERS","ABSOLVES","ABSOLVING","ABSONANT","ABSORB","ABSORBABILITIES","ABSORBABILITY",
                   "ABSORBABLE","ABSORBANCE","ABSORBANCES","ABSORBANCIES","ABSORBANCY","ABSORBANT","ABSORBANTS","ABSORBED",
                   "ABSORBENCIES","ABSORBENCY","ABSORBENT","ABSORBENTS","ABSORBER","ABSORBERS","ABSORBING","ABSORBINGLY",
                   "ABSORBS","ABSORPTANCE","ABSORPTANCES","ABSORPTION","ABSORPTIONS","ABSORPTIVE","ABSORPTIVITIES","ABSORPTIVITY",
                   "ABSTAIN","ABSTAINED","ABSTAINER","ABSTAINERS","ABSTAINING","ABSTAINS","ABSTEMIOUS","ABSTEMIOUSLY",
                   "ABSTEMIOUSNESS","ABSTENTION","ABSTENTIONS","ABSTENTIOUS","ABSTERGE","ABSTERGED","ABSTERGES","ABSTERGING",
                   "ABSTINENCE","ABSTINENCES","ABSTINENT","ABSTINENTLY","ABSTRACT","ABSTRACTABLE","ABSTRACTED","ABSTRACTEDLY",
                   "ABSTRACTEDNESS","ABSTRACTER","ABSTRACTERS","ABSTRACTEST","ABSTRACTING","ABSTRACTION","ABSTRACTIONAL","ABSTRACTIONISM",
                   "ABSTRACTIONISMS","ABSTRACTIONIST","ABSTRACTIONISTS","ABSTRACTIONS","ABSTRACTIVE","ABSTRACTLY","ABSTRACTNESS",
                   "ABSTRACTNESSES","ABSTRACTOR","ABSTRACTORS","ABSTRACTS","ABSTRICT","ABSTRICTED","ABSTRICTING","ABSTRICTS","ABSTRUSE",
                   "ABSTRUSELY","ABSTRUSENESS","ABSTRUSENESSES","ABSTRUSER","ABSTRUSEST","ABSTRUSITIES","ABSTRUSITY","ABSURD","ABSURDER",
                   "ABSURDEST","ABSURDISM","ABSURDISMS","ABSURDIST","ABSURDISTS","ABSURDITIES","ABSURDITY","ABSURDLY","ABSURDNESS",
                   "ABSURDNESSES","ABSURDS","ABUBBLE","ABUILDING","ABULIA","ABULIAS","ABULIC","ABUNDANCE","ABUNDANCES","ABUNDANT","ABUNDANTLY",
                   "ABUSABLE","ABUSE","ABUSED","ABUSER","ABUSERS","ABUSES","ABUSING","ABUSIVE","ABUSIVELY","ABUSIVENESS","ABUSIVENESSES","ABUT",
                   "ABUTILON","ABUTILONS","ABUTMENT","ABUTMENTS","ABUTS","ABUTTAL","ABUTTALS","ABUTTED","ABUTTER","ABUTTERS","ABUTTING","ABUZZ",
                   "ABVOLT","ABVOLTS","ABWATT","ABWATTS","ABY","ABYE","ABYES","ABYING","ABYS","ABYSM","ABYSMAL","ABYSMALLY","ABYSMS","ABYSS","ABYSSAL",
                   "ABYSSES","ACACIA","ACACIAS","ACADEME","ACADEMES","ACADEMIA","ACADEMIAS","ACADEMIC","ACADEMICAL","ACADEMICALLY","ACADEMICIAN",
                   "ACADEMICIANS","ACADEMICISM","ACADEMICISMS","ACADEMICS","ACADEMIES","ACADEMISM","ACADEMISMS","ACADEMY","ACAJOU","ACAJOUS","ACALEPH",
                   "ACALEPHAE","ACALEPHE","ACALEPHES","ACALEPHS","ACANTHA","ACANTHAE","ACANTHI","ACANTHINE","ACANTHOCEPHALAN","ACANTHOID","ACANTHOUS",
                   "ACANTHUS","ACANTHUSES","ACAPNIA","ACAPNIAS","ACARBOSE","ACARBOSES","ACARI","ACARIASES","ACARIASIS","ACARICIDAL","ACARICIDE","ACARICIDES",
                   "ACARID","ACARIDAN","ACARIDANS","ACARIDS","ACARINE","ACARINES","ACAROID","ACAROLOGIES","ACAROLOGY","ACARPOUS","ACARUS","ACATALECTIC",
                   "ACATALECTICS","ACAUDAL","ACAUDATE","ACAULESCENT","ACAULINE","ACAULOSE","ACAULOUS","ACCEDE","ACCEDED","ACCEDENCE","ACCEDENCES","ACCEDER",
                   "ACCEDERS","ACCEDES","ACCEDING","ACCELERANDO","ACCELERANDOS","ACCELERANT","ACCELERANTS","ACCELERATE","ACCELERATED","ACCELERATES","ACCELERATING",
                   "ACCELERATINGLY","ACCELERATION","ACCELERATIONS","ACCELERATIVE","ACCELERATOR","ACCELERATORS","ACCELEROMETER","ACCELEROMETERS","ACCENT",
                   "ACCENTED","ACCENTING","ACCENTLESS","ACCENTOR","ACCENTORS","ACCENTS","ACCENTUAL","ACCENTUALLY","ACCENTUATE","ACCENTUATED","ACCENTUATES",
                   "ACCENTUATING","ACCENTUATION","ACCENTUATIONS","ACCEPT","ACCEPTABILITIES","ACCEPTABILITY","ACCEPTABLE","ACCEPTABLENESS","ACCEPTABLY","ACCEPTANCE",
                   "ACCEPTANCES","ACCEPTANT","ACCEPTATION","ACCEPTATIONS","ACCEPTED","ACCEPTEDLY","ACCEPTEE","ACCEPTEES","ACCEPTER","ACCEPTERS","ACCEPTING","ACCEPTINGLY",
                   "ACCEPTINGNESS","ACCEPTINGNESSES","ACCEPTIVE","ACCEPTOR","ACCEPTORS","ACCEPTS","ACCESS","ACCESSARIES","ACCESSARY","ACCESSED","ACCESSES","ACCESSIBILITIES",
                   "ACCESSIBILITY","ACCESSIBLE","ACCESSIBLENESS","ACCESSIBLY","ACCESSING","ACCESSION","ACCESSIONAL","ACCESSIONED","ACCESSIONING","ACCESSIONS","ACCESSORIAL",
                   "ACCESSORIES","ACCESSORISE","ACCESSORISED","ACCESSORISES","ACCESSORISING","ACCESSORIZE","ACCESSORIZED","ACCESSORIZES","ACCESSORIZING","ACCESSORY",
                   "ACCIACCATURA","ACCIACCATURAS","ACCIDENCE","ACCIDENCES","ACCIDENT","ACCIDENTAL","ACCIDENTALLY","ACCIDENTALNESS","ACCIDENTALS","ACCIDENTLY","ACCIDENTS",
                   "ACCIDIA","ACCIDIAS","ACCIDIE","ACCIDIES","ACCIPITER","ACCIPITERS","ACCIPITRINE","ACCIPITRINES","ACCLAIM","ACCLAIMED","ACCLAIMER","ACCLAIMERS","ACCLAIMING",
                   "ACCLAIMS","ACCLAMATION","ACCLAMATIONS","ACCLIMATE","ACCLIMATED","ACCLIMATES","ACCLIMATING","ACCLIMATION","ACCLIMATIONS","ACCLIMATISE","ACCLIMATISED",
                   "ACCLIMATISES","ACCLIMATISING","ACCLIMATIZATION","ACCLIMATIZE","ACCLIMATIZED","ACCLIMATIZER","ACCLIMATIZERS","ACCLIMATIZES","ACCLIMATIZING","ACCLIVITIES",
                   "ACCLIVITY","ACCLIVOUS","ACCOLADE","ACCOLADED","ACCOLADES","ACCOLADING","ACCOMMODATE","ACCOMMODATED","ACCOMMODATES","ACCOMMODATING","ACCOMMODATINGLY",
                   "ACCOMMODATION","ACCOMMODATIONAL","ACCOMMODATIONS","ACCOMMODATIVE","ACCOMMODATOR","ACCOMMODATORS","ACCOMPANIED","ACCOMPANIES","ACCOMPANIMENT","ACCOMPANIMENTS",
                   "ACCOMPANIST","ACCOMPANISTS","ACCOMPANY","ACCOMPANYING","ACCOMPLICE","ACCOMPLICES","ACCOMPLISH","ACCOMPLISHABLE","ACCOMPLISHED","ACCOMPLISHER","ACCOMPLISHERS",
                   "ACCOMPLISHES","ACCOMPLISHING","ACCOMPLISHMENT","ACCOMPLISHMENTS","ACCORD","ACCORDANCE","ACCORDANCES","ACCORDANT","ACCORDANTLY","ACCORDED","ACCORDER","ACCORDERS",
                   "ACCORDING","ACCORDINGLY","ACCORDION","ACCORDIONIST","ACCORDIONISTS","ACCORDIONS","ACCORDS","ACCOST","ACCOSTED","ACCOSTING","ACCOSTS","ACCOUCHEMENT",
                   "ACCOUCHEMENTS","ACCOUCHEUR","ACCOUCHEURS","ACCOUNT","ACCOUNTABILITY","ACCOUNTABLE","ACCOUNTABLENESS","ACCOUNTABLY","ACCOUNTANCIES",
                   "ACCOUNTANCY","ACCOUNTANT","ACCOUNTANTS","ACCOUNTANTSHIP","ACCOUNTANTSHIPS","ACCOUNTED","ACCOUNTING","ACCOUNTINGS","ACCOUNTS","ACCOUTER"
                   ,"ACCOUTERED","ACCOUTERING","ACCOUTERMENT","ACCOUTERMENTS","ACCOUTERS","ACCOUTRE","ACCOUTRED","ACCOUTREMENT","ACCOUTREMENTS",
                   "ACCOUTRES","ACCOUTRING","ACCREDIT","ACCREDITABLE","ACCREDITATION","ACCREDITATIONS","ACCREDITED","ACCREDITING","ACCREDITS","ACCRETE",
                   "ACCRETED","ACCRETES","ACCRETING","ACCRETION","ACCRETIONARY","ACCRETIONS","ACCRETIVE","ACCRUABLE","ACCRUAL","ACCRUALS","ACCRUE","ACCRUED",
                   "ACCRUEMENT","ACCRUEMENTS","ACCRUES","ACCRUING","ACCULTURATE","ACCULTURATED","ACCULTURATES","ACCULTURATING","ACCULTURATION","ACCULTURATIONAL",]

const wordsNotInserted = ["FLOUNCY","FLOUNDER","FLOUNDERED","FLOUNDERING","FLOUNDERS","FLOUR","FLOURED","FLOURING","FLOURISH","FLOURISHED","FLOURISHER","FLOURISHERS",
                          "FLOURISHES","FLOURISHING","FLOURISHINGLY","FLOURLESS","FLOURS","FLOURY","FLOUT","FLOUTED","FLOUTER","FLOUTERS","FLOUTING","FLOUTS","FLOW","FLOWAGE","FLOWAGES",
                          "FLOWCHART","FLOWCHARTING","FLOWCHARTINGS","FLOWCHARTS","FLOWED","FLOWER","FLOWERAGE","FLOWERAGES","FLOWERED","FLOWERER","FLOWERERS","FLOWERET","FLOWERETS",
                          "FLOWERETTE","FLOWERETTES","FLOWERFUL","FLOWERIER","FLOWERIEST","FLOWERILY","FLOWERINESS","FLOWERINESSES","FLOWERING","FLOWERLESS","FLOWERLIKE","FLOWERPOT",
                          "FLOWERPOTS","FLOWERS","FLOWERY","FLOWING","FLOWINGLY","FLOWMETER","FLOWMETERS","FLOWN","FLOWS","FLOWSTONE","FLOWSTONES","FLU","FLUB","FLUBBED","FLUBBER","FLUBBERS",
                          "FLUBBING","FLUBDUB","FLUBDUBS","FLUBS","FLUCTUANT","FLUCTUATE","FLUCTUATED","FLUCTUATES","FLUCTUATING","FLUCTUATION","FLUCTUATIONAL","FLUCTUATIONS","FLUE","FLUED",
                          "FLUEGELHORN","FLUEGELHORNS","FLUENCIES","FLUENCY","FLUENT","FLUENTLY","FLUERIC","FLUERICS","FLUES","FLUFF","FLUFFED","FLUFFER","FLUFFERS","FLUFFIER","FLUFFIEST",
                          "FLUFFILY","FLUFFINESS","FLUFFINESSES","FLUFFING","FLUFFS","FLUFFY","FLUGELHORN","FLUGELHORNIST","FLUGELHORNISTS","FLUGELHORNS","FLUID","FLUIDAL","FLUIDALLY",
                          "FLUIDEXTRACT","FLUIDEXTRACTS","FLUIDIC","FLUIDICS","FLUIDISE","FLUIDISED","FLUIDISES","FLUIDISING","FLUIDITIES","FLUIDITY","FLUIDIZATION","FLUIDIZATIONS","FLUIDIZE",
                          "FLUIDIZED","FLUIDIZER","FLUIDIZERS","FLUIDIZES","FLUIDIZING","FLUIDLIKE","FLUIDLY","FLUIDNESS","FLUIDNESSES","FLUIDRAM","FLUIDRAMS","FLUIDS","FLUISH","FLUKE","FLUKED",
                          "FLUKES","FLUKEY","FLUKIER","FLUKIEST","FLUKILY","FLUKINESS","FLUKINESSES","FLUKING","FLUKY","FLUME","FLUMED","FLUMES","FLUMING","FLUMMERIES","FLUMMERY","FLUMMOX","FLUMMOXED",
                          "FLUMMOXES","FLUMMOXING","FLUMP","FLUMPED","FLUMPING","FLUMPS","FLUNG","FLUNK","FLUNKED","FLUNKER","FLUNKERS","FLUNKEY","FLUNKEYS","FLUNKIE","FLUNKIES","FLUNKING","FLUNKS",
                          "FLUNKY","FLUNKYISM","FLUNKYISMS","FLUOR","FLUORENE","FLUORENES","FLUORESCE","FLUORESCED","FLUORESCEIN","FLUORESCEINS","FLUORESCENCE","FLUORESCENCES","FLUORESCENT","FLUORESCENTS",
                          "FLUORESCER","FLUORESCERS","FLUORESCES","FLUORESCING","FLUORIC","FLUORID","FLUORIDATE","FLUORIDATED","FLUORIDATES","FLUORIDATING","FLUORIDATION","FLUORIDATIONS",
                          "FLUORIDE","FLUORIDES","FLUORIDS","FLUORIMETER","FLUORIMETERS","FLUORIMETRIC","FLUORIMETRIES","FLUORIMETRY","FLUORIN","FLUORINATE","FLUORINATED","FLUORINATES",
                          "FLUORINATING","FLUORINATION","FLUORINATIONS","FLUORINE","FLUORINES","FLUORINS","FLUORITE","FLUORITES","FLUOROCARBON","FLUOROCARBONS","FLUOROCHROME","FLUOROCHROMES",
                          "FLUOROGRAPHIC","FLUOROGRAPHIES","FLUOROGRAPHY","FLUOROMETER","FLUOROMETERS","FLUOROMETRIC","FLUOROMETRIES","FLUOROMETRY","FLUOROSCOPE","FLUOROSCOPED","FLUOROSCOPES",
                          "FLUOROSCOPIC","FLUOROSCOPIES","FLUOROSCOPING","FLUOROSCOPIST","FLUOROSCOPISTS","FLUOROSCOPY","FLUOROSES","FLUOROSIS","FLUOROTIC","FLUOROURACIL","FLUOROURACILS",
                          "FLUORS","FLUORSPAR","FLUORSPARS","FLUOXETINE","FLUOXETINES","FLUPHENAZINE","FLUPHENAZINES","FLURRIED","FLURRIES","FLURRY","FLURRYING","FLUS","FLUSH","FLUSHABLE",
                          "FLUSHED","FLUSHER","FLUSHERS","FLUSHES","FLUSHEST","FLUSHING","FLUSHNESS","FLUSHNESSES","FLUSTER","FLUSTERED","FLUSTEREDLY","FLUSTERING","FLUSTERS","FLUTE","FLUTED",
                          "FLUTELIKE","FLUTER","FLUTERS","FLUTES","FLUTEY","FLUTIER","FLUTIEST","FLUTING","FLUTINGS","FLUTIST","FLUTISTS","FLUTTER","FLUTTERBOARD","FLUTTERBOARDS","FLUTTERED",
                          "FLUTTERER","FLUTTERERS","FLUTTERING","FLUTTERS","FLUTTERY","FLUTY","FLUVIAL","FLUVIATILE","FLUX","FLUXED","FLUXES","FLUXGATE","FLUXGATES","FLUXING","FLUXION","FLUXIONAL",
                          "FLUXIONS","FLUYT","FLUYTS","FLY","FLYABLE","FLYAWAY","FLYAWAYS","FLYBELT","FLYBELTS","FLYBLEW","FLYBLOW","FLYBLOWING","FLYBLOWN","FLYBLOWS","FLYBOAT","FLYBOATS","FLYBOY",
                          "FLYBOYS","FLYBRIDGE","FLYBRIDGES","FLYBY","FLYBYS","FLYCATCHER","FLYCATCHERS","FLYER","FLYERS","FLYING","FLYINGS","FLYLEAF","FLYLEAVES","FLYLESS","FLYMAN","FLYMEN","FLYOFF",
                          "FLYOFFS","FLYOVER","FLYOVERS","FLYPAPER","FLYPAPERS","FLYPAST","FLYPASTS","FLYRODDER","FLYRODDERS","FLYSCH","FLYSCHES","FLYSHEET","FLYSHEETS","FLYSPECK","FLYSPECKED",
                          "FLYSPECKING","FLYSPECKS","FLYSWATTER","FLYSWATTERS","FLYTE","FLYTED","FLYTES","FLYTIER","FLYTIERS","FLYTING","FLYTINGS","FLYTRAP","FLYTRAPS","FLYWAY","FLYWAYS","FLYWEIGHT",
                          "FLYWEIGHTS","FLYWHEEL","FLYWHEELS","FOAL","FOALED","FOALING","FOALS","FOAM","FOAMABLE","FOAMED","FOAMER","FOAMERS","FOAMFLOWER","FOAMFLOWERS","FOAMIER","FOAMIEST",
                          "FOAMILY","FOAMINESS","FOAMINESSES","FOAMING","FOAMLESS","FOAMLIKE","FOAMS","FOAMY","FOB","FOBBED","FOBBING","FOBS","FOCACCIA","FOCACCIAS","FOCAL","FOCALISE","FOCALISED",
                          "FOCALISES","FOCALISING","FOCALIZATION","FOCALIZATIONS","FOCALIZE","FOCALIZED","FOCALIZES","FOCALIZING","FOCALLY","FOCI","FOCUS","FOCUSABLE","FOCUSED","FOCUSER","FOCUSERS",
                          "FOCUSES","FOCUSING","FOCUSLESS","FOCUSSED","FOCUSSES","FOCUSSING","FODDER","FODDERED","FODDERING","FODDERS","FODGEL","FOE","FOEHN","FOEHNS","FOEMAN","FOEMEN","FOES",
                          "FOETAL","FOETID","FOETOR","FOETORS","FOETUS","FOETUSES","FOG","FOGBOUND","FOGBOW","FOGBOWS","FOGDOG","FOGDOGS","FOGEY","FOGEYISH","FOGEYISM","FOGEYISMS","FOGEYS","FOGFRUIT",
                          "FOGFRUITS","FOGGAGE","FOGGAGES","FOGGED","FOGGER","FOGGERS","FOGGIER","FOGGIEST","FOGGILY","FOGGINESS","FOGGINESSES","FOGGING","FOGGY","FOGHORN","FOGHORNS","FOGIE","FOGIES",
                          "FOGLESS","FOGS","FOGY","FOGYISH","FOGYISM","FOGYISMS","FOH","FOHN","FOHNS","FOIBLE","FOIBLES","FOIL","FOILABLE","FOILED","FOILING","FOILS","FOILSMAN","FOILSMEN","FOIN","FOINED",
                          "FOINING","FOINS","FOISON","FOISONS","FOIST","FOISTED","FOISTING","FOISTS","FOLACIN","FOLACINS","FOLATE","FOLATES","FOLD","FOLDABLE","FOLDAWAY","FOLDAWAYS","FOLDBOAT","FOLDBOATS",
                          "FOLDED","FOLDER","FOLDEROL","FOLDEROLS","FOLDERS","FOLDING","FOLDOUT","FOLDOUTS","FOLDS","FOLDUP","FOLDUPS","FOLEY","FOLEYS","FOLIA","FOLIACEOUS","FOLIAGE","FOLIAGED",
                          "FOLIAGES","FOLIAR","FOLIATE","FOLIATED","FOLIATES","FOLIATING","FOLIATION","FOLIATIONS","FOLIC"]

wordsInserted.forEach((word) => dictionary.insert(word));
let count = 0;
wordsInserted.forEach((word) => (dictionary.search(word)) ? count++ : count);

console.log(`CHECK FOR NUMBER OF INSERTED WORDS: ${(count === wordsInserted.length) ? `ALL PASS, ${count} words inserted` : "FAIL"}`);
console.log(`CHECK FOR INSERTED WORDS: ${(wordsInserted.every((word) => dictionary.search(word))) ? `ALL PASS, ${count} words found` : "FAIL"}`);
console.log(`CHECK FOR WORDS NOT IN DICTIONARY: ${(wordsNotInserted.every((word) => dictionary.search(word) === false)) ? `PASS, no words found` : "FAIL"}`);